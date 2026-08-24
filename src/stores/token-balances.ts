import { formatUnits } from "viem";
import type { Address } from "viem";
import { TOKEN_BALANCE_POLL_MS } from "@/components/token-network-dialog/config";
import { isAddressValid } from "@/utils";
import type { ChainKind, ChainOwners } from "@/wallet";
import type { IntentsToken } from "@/stores/intents-tokens";
import { getPublicClientForNetwork, readErc20Balance, readErc20Balances } from "@/wallet/evm/balance";
import { readNearFtBalance } from "@/wallet/near/balance";
import { readSplBalance } from "@/wallet/solana/balance";
import { create } from "zustand";

export type TokenBalanceStatus = "idle" | "loading" | "success" | "error";

export interface TokenBalanceEntry {
  raw: bigint | null;
  formatted: string | null;
  status: TokenBalanceStatus;
  updatedAt: number | null;
  error: string | null;
}

export type FetchTokenBalancesOpts = {
  force?: boolean;
};

interface TokenBalancesState {
  balances: Record<string, TokenBalanceEntry>;
  fetchAll: (owners: ChainOwners, tokens: IntentsToken[], opts?: FetchTokenBalancesOpts) => Promise<void>;
  fetchOne: (owner: string, token: IntentsToken) => Promise<TokenBalanceEntry | null>;
  getBalance: (owner: string | null | undefined, assetId: string | null | undefined) => TokenBalanceEntry | undefined;
  clear: () => void;
}

function ownerKey(owner: string, chainKind: string): string {
  return chainKind === "solana" ? owner : owner.toLowerCase();
}

function balanceKey(owner: string, assetId: string, chainKind = "evm"): string {
  return `${ownerKey(owner, chainKind)}:${assetId}`;
}

function chainFetchKey(owner: string, blockchain: string, chainKind: ChainKind): string {
  return `${ownerKey(owner, chainKind)}:${blockchain}`;
}

function tokenChainKind(token: IntentsToken): ChainKind | null {
  const kind = token.chain.chainKind;
  if (kind === "evm" || kind === "near" || kind === "solana") return kind;
  return null;
}

function ownerForToken(owners: ChainOwners, token: IntentsToken): string | undefined {
  const kind = tokenChainKind(token);
  return kind ? owners[kind] : undefined;
}

const chainInflight = new Map<string, Promise<void>>();

function loadingEntry(): TokenBalanceEntry {
  return {
    raw: null,
    formatted: null,
    status: "loading",
    updatedAt: null,
    error: null,
  };
}

function errorEntry(error: string): TokenBalanceEntry {
  return {
    raw: null,
    formatted: null,
    status: "error",
    updatedAt: Date.now(),
    error,
  };
}

function successEntry(raw: bigint, formatted: string): TokenBalanceEntry {
  return {
    raw,
    formatted,
    status: "success",
    updatedAt: Date.now(),
    error: null,
  };
}

function markLoading(prev: TokenBalanceEntry | undefined): TokenBalanceEntry {
  if (!prev) return loadingEntry();
  return { ...prev, status: "loading", error: null };
}

function withStaleOnError(prev: TokenBalanceEntry | undefined, next: TokenBalanceEntry): TokenBalanceEntry {
  if (next.status !== "error") return next;
  if (prev?.raw == null && prev?.formatted == null) return next;
  return {
    ...next,
    raw: prev.raw,
    formatted: prev.formatted,
    updatedAt: prev.updatedAt,
  };
}

function isFresh(entry: TokenBalanceEntry | undefined, now: number): boolean {
  return Boolean(
    entry
    && entry.status === "success"
    && entry.updatedAt != null
    && now - entry.updatedAt < TOKEN_BALANCE_POLL_MS,
  );
}

async function readOne(owner: string, token: IntentsToken): Promise<TokenBalanceEntry> {
  const kind = tokenChainKind(token);
  if (!kind || !isAddressValid(owner, kind)) {
    return errorEntry("Wallet address does not match this chain");
  }
  if (!token.contractAddress) {
    return errorEntry("Missing contract address");
  }
  try {
    let raw = 0n;
    if (kind === "near") {
      raw = await readNearFtBalance({ tokenContract: token.contractAddress, owner });
    } else if (kind === "solana") {
      raw = await readSplBalance({ tokenMint: token.contractAddress, owner });
    } else {
      // TODO: origin / balance reads for Tron once payout broadcast is supported.
      if (!getPublicClientForNetwork(token.blockchain)) {
        return errorEntry("Unsupported network");
      }
      const result = await readErc20Balance({
        network: token.blockchain,
        tokenAddress: token.contractAddress as Address,
        owner: owner as Address,
        decimals: token.decimals,
      });
      raw = result.raw;
    }
    return successEntry(raw, formatUnits(raw, token.decimals));
  } catch (cause) {
    return errorEntry(cause instanceof Error ? cause.message : "Failed to read balance");
  }
}

function uniqueTokens(tokens: IntentsToken[]): IntentsToken[] {
  const unique = new Map<string, IntentsToken>();
  for (const token of tokens) {
    if (!unique.has(token.assetId)) unique.set(token.assetId, token);
  }
  return Array.from(unique.values());
}

function groupByChain(tokens: IntentsToken[]): Map<string, IntentsToken[]> {
  const groups = new Map<string, IntentsToken[]>();
  for (const token of tokens) {
    const list = groups.get(token.blockchain) ?? [];
    list.push(token);
    groups.set(token.blockchain, list);
  }
  return groups;
}

export const useTokenBalancesStore = create<TokenBalancesState>((set, get) => {
  function writeEntries(updates: Array<{ key: string; entry: TokenBalanceEntry }>) {
    set((state) => {
      const next = { ...state.balances };
      for (const { key, entry } of updates) {
        next[key] = withStaleOnError(state.balances[key], entry);
      }
      return { balances: next };
    });
  }

  function markTokensLoading(owner: string, tokens: IntentsToken[]) {
    set((state) => {
      const next = { ...state.balances };
      for (const token of tokens) {
        const kind = tokenChainKind(token);
        if (!kind) continue;
        const key = balanceKey(owner, token.assetId, kind);
        next[key] = markLoading(next[key]);
      }
      return { balances: next };
    });
  }

  async function fetchEvmChain(
    owner: string,
    blockchain: string,
    tokens: IntentsToken[],
    force: boolean,
  ) {
    const now = Date.now();
    const allFresh = tokens.every((token) =>
      isFresh(get().balances[balanceKey(owner, token.assetId, "evm")], now),
    );
    if (!force && allFresh) return;

    markTokensLoading(owner, tokens);

    const readable = tokens.filter((token) => token.contractAddress);
    const missing = tokens.filter((token) => !token.contractAddress);
    const updates: Array<{ key: string; entry: TokenBalanceEntry }> = missing.map((token) => ({
      key: balanceKey(owner, token.assetId, "evm"),
      entry: errorEntry("Missing contract address"),
    }));

    if (readable.length > 0) {
      try {
        const results = await readErc20Balances({
          network: blockchain,
          owner: owner as Address,
          tokens: readable.map((token) => ({
            assetId: token.assetId,
            tokenAddress: token.contractAddress as Address,
            decimals: token.decimals,
          })),
        });
        for (const result of results) {
          const key = balanceKey(owner, result.assetId, "evm");
          if ("error" in result) {
            updates.push({ key, entry: errorEntry(result.error) });
          } else {
            updates.push({ key, entry: successEntry(result.raw, result.formatted) });
          }
        }
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : "Failed to read balance";
        for (const token of readable) {
          updates.push({
            key: balanceKey(owner, token.assetId, "evm"),
            entry: errorEntry(message),
          });
        }
      }
    }

    writeEntries(updates);
  }

  async function fetchOtherChain(owner: string, tokens: IntentsToken[], force: boolean) {
    const now = Date.now();
    const stale = tokens.filter((token) => {
      const kind = tokenChainKind(token);
      if (!kind) return false;
      return force || !isFresh(get().balances[balanceKey(owner, token.assetId, kind)], now);
    });
    if (stale.length === 0) return;

    markTokensLoading(owner, stale);
    const results = await Promise.allSettled(
      stale.map(async (token) => {
        const entry = await readOne(owner, token);
        return { token, entry };
      }),
    );
    const updates: Array<{ key: string; entry: TokenBalanceEntry }> = [];
    for (const result of results) {
      if (result.status !== "fulfilled") continue;
      const { token, entry } = result.value;
      const kind = tokenChainKind(token);
      if (!kind) continue;
      updates.push({ key: balanceKey(owner, token.assetId, kind), entry });
    }
    writeEntries(updates);
  }

  function fetchChainGroup(owner: string, tokens: IntentsToken[], force: boolean) {
    const blockchain = tokens[0]?.blockchain;
    const kind = tokens[0] ? tokenChainKind(tokens[0]) : null;
    if (!blockchain || !kind) return Promise.resolve();
    if (!isAddressValid(owner, kind)) {
      writeEntries(tokens.map((token) => ({
        key: balanceKey(owner, token.assetId, kind),
        entry: errorEntry("Wallet address does not match this chain"),
      })));
      return Promise.resolve();
    }

    const key = chainFetchKey(owner, blockchain, kind);
    const pending = chainInflight.get(key);
    if (pending) return pending;

    const run = kind === "evm"
      ? fetchEvmChain(owner, blockchain, tokens, force)
      : fetchOtherChain(owner, tokens, force);

    chainInflight.set(key, run);
    return run.finally(() => {
      if (chainInflight.get(key) === run) chainInflight.delete(key);
    });
  }

  return {
    balances: {},

    getBalance: (owner, assetId) => {
      if (!owner || !assetId) return undefined;
      return get().balances[`${owner}:${assetId}`]
        || get().balances[`${owner.toLowerCase()}:${assetId}`];
    },

    clear: () => set({ balances: {} }),

    fetchOne: async (owner, token) => {
      const key = balanceKey(owner, token.assetId, token.chain.chainKind);
      set((state) => ({
        balances: {
          ...state.balances,
          [key]: markLoading(state.balances[key]),
        },
      }));
      const entry = await readOne(owner, token);
      set((state) => ({
        balances: { ...state.balances, [key]: withStaleOnError(state.balances[key], entry) },
      }));
      return get().balances[key] ?? entry;
    },

    fetchAll: async (owners, tokens, opts) => {
      const force = Boolean(opts?.force);
      const groups = groupByChain(
        uniqueTokens(tokens).filter((token) => ownerForToken(owners, token)),
      );
      await Promise.all(
        Array.from(groups.entries()).map(([, group]) => {
          const owner = ownerForToken(owners, group[0]);
          if (!owner) return Promise.resolve();
          return fetchChainGroup(owner, group, force);
        }),
      );
    },
  };
});
