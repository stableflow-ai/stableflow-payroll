import { formatUnits } from "viem";
import type { Address } from "viem";
import { isAddressValid } from "@/utils";
import type { ChainKind, ChainOwners } from "@/wallet";
import type { IntentsToken } from "@/stores/intents-tokens";
import { getPublicClientForNetwork, readErc20Balance } from "@/wallet/evm/balance";
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

interface TokenBalancesState {
  balances: Record<string, TokenBalanceEntry>;
  fetchAll: (owners: ChainOwners, tokens: IntentsToken[]) => Promise<void>;
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

function tokenChainKind(token: IntentsToken): ChainKind | null {
  const kind = token.chain.chainKind;
  if (kind === "evm" || kind === "near" || kind === "solana") return kind;
  return null;
}

function ownerForToken(owners: ChainOwners, token: IntentsToken): string | undefined {
  const kind = tokenChainKind(token);
  return kind ? owners[kind] : undefined;
}

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
        return {
          raw: 0n,
          formatted: "0",
          status: "error",
          updatedAt: Date.now(),
          error: "Unsupported network",
        };
      }
      const result = await readErc20Balance({
        network: token.blockchain,
        tokenAddress: token.contractAddress as Address,
        owner: owner as Address,
        decimals: token.decimals,
      });
      raw = result.raw;
    }
    return {
      raw,
      formatted: formatUnits(raw, token.decimals),
      status: "success",
      updatedAt: Date.now(),
      error: null,
    };
  } catch (cause) {
    return errorEntry(cause instanceof Error ? cause.message : "Failed to read balance");
  }
}

export const useTokenBalancesStore = create<TokenBalancesState>((set, get) => ({
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

  fetchAll: async (owners, tokens) => {
    const unique = new Map<string, IntentsToken>();
    for (const token of tokens) {
      if (!unique.has(token.assetId)) unique.set(token.assetId, token);
    }
    const list = Array.from(unique.values()).filter((token) => ownerForToken(owners, token));
    if (list.length === 0) return;

    set((state) => {
      const next = { ...state.balances };
      for (const token of list) {
        const owner = ownerForToken(owners, token);
        if (!owner) continue;
        const key = balanceKey(owner, token.assetId, token.chain.chainKind);
        next[key] = markLoading(next[key]);
      }
      return { balances: next };
    });

    const results = await Promise.allSettled(
      list.map(async (token) => {
        const owner = ownerForToken(owners, token)!;
        const entry = await readOne(owner, token);
        return { token, owner, entry };
      }),
    );

    set((state) => {
      const next = { ...state.balances };
      for (const result of results) {
        if (result.status !== "fulfilled") continue;
        const { token, owner, entry } = result.value;
        const key = balanceKey(owner, token.assetId, token.chain.chainKind);
        next[key] = withStaleOnError(state.balances[key], entry);
      }
      return { balances: next };
    });
  },
}));
