import { FIXED_CHAINS, type ChainConfig } from "@/config/chains";
import type { IntentsToken } from "@/stores/intents-tokens";
import type { WalletChainKind } from "@/utils";
import { ALL_CHAIN_FILTER } from "./config";

/** USD value of a token balance using `/v0/tokens` price. Unknown balance is -1 (sort last). */
export function tokenBalanceUsd(
  token: Pick<IntentsToken, "price">,
  formatted: string | null | undefined,
): number {
  if (formatted == null || formatted === "") return -1;
  const amount = Number(formatted);
  if (!Number.isFinite(amount)) return -1;
  const price = Number(token.price);
  return amount * (Number.isFinite(price) ? price : 0);
}

export function tokenMatchesSearch(
  token: Pick<IntentsToken, "contractAddress"> & { symbol: string; providerSymbol: string },
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (token.symbol.toLowerCase().includes(q)) return true;
  if (token.providerSymbol.toLowerCase().includes(q)) return true;
  return Boolean(token.contractAddress?.toLowerCase().includes(q));
}

export function matchesChainFilter(
  token: Pick<IntentsToken, "blockchain">,
  chainFilter: string,
): boolean {
  if (chainFilter === ALL_CHAIN_FILTER) return true;
  return token.blockchain === chainFilter;
}

export function formattedBalancePositive(formatted: string | null | undefined): boolean {
  if (formatted == null || formatted === "") return false;
  const amount = Number(formatted);
  return Number.isFinite(amount) && amount > 0;
}

export function chainHasBalance<T extends Pick<IntentsToken, "blockchain">>(
  blockchain: string,
  tokens: T[],
  getBalance: (token: T) => string | null | undefined,
): boolean {
  return tokens.some(
    (token) => token.blockchain === blockchain && formattedBalancePositive(getBalance(token)),
  );
}

export function visibleNetworkChips(
  available: ChainConfig[],
  recentBlockchains: readonly string[],
  slotCount: number,
  pinnedBlockchain?: string | null,
): ChainConfig[] {
  const byCode = new Map(available.map((chain) => [chain.blockchain, chain]));
  const result: ChainConfig[] = [];
  const used = new Set<string>();

  function push(code: string | null | undefined) {
    if (!code || used.has(code) || result.length >= slotCount) return;
    const chain = byCode.get(code);
    if (!chain) return;
    result.push(chain);
    used.add(chain.blockchain);
  }

  push(pinnedBlockchain);
  for (const code of recentBlockchains) push(code);
  for (const chain of available) push(chain.blockchain);
  return result;
}

export function initialChainFilter(
  lockChainKind: WalletChainKind | null | undefined,
  recentBlockchains: readonly string[],
  chains: readonly ChainConfig[] = FIXED_CHAINS,
): string {
  if (!lockChainKind) return ALL_CHAIN_FILTER;
  const matching = chains.filter((chain) => chain.chainKind === lockChainKind);
  if (matching.length === 0) return ALL_CHAIN_FILTER;
  for (const code of recentBlockchains) {
    if (matching.some((chain) => chain.blockchain === code)) return code;
  }
  return matching[0].blockchain;
}

export function overflowNetworkCount(availableCount: number, visibleCount: number): number {
  return Math.max(0, availableCount - visibleCount);
}

export function isBlockchainDisabled(
  blockchain: string,
  disabledBlockchains: string[] | null | undefined,
): boolean {
  if (!disabledBlockchains?.length) return false;
  const code = blockchain.toLowerCase();
  return disabledBlockchains.some((item) => item.toLowerCase() === code);
}

export function isChainKindLocked(
  chainKind: WalletChainKind,
  lockChainKind: WalletChainKind | null | undefined,
): boolean {
  return Boolean(lockChainKind && chainKind !== lockChainKind);
}

export function sortTokensForSelect<T extends {
  assetId: string;
  symbol: string;
  chain: { chainName: string };
}>(
  tokens: T[],
  options: {
    lastAssetId: string | null;
    showBalances: boolean;
    getBalanceUsd: (token: T) => number;
  },
): T[] {
  return tokens.slice().sort((left, right) => {
    const leftRecent = left.assetId === options.lastAssetId ? 0 : 1;
    const rightRecent = right.assetId === options.lastAssetId ? 0 : 1;
    if (leftRecent !== rightRecent) return leftRecent - rightRecent;
    const bySymbol =
      left.symbol.localeCompare(right.symbol) || left.chain.chainName.localeCompare(right.chain.chainName);
    if (!options.showBalances) return bySymbol;
    const leftUsd = options.getBalanceUsd(left);
    const rightUsd = options.getBalanceUsd(right);
    if (rightUsd !== leftUsd) return rightUsd - leftUsd;
    return bySymbol;
  });
}
