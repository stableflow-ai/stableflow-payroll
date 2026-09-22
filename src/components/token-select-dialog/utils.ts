import { getRuntimeChains, type ChainConfig } from "@/config/chains";
import type { IntentsToken } from "@/stores/intents-tokens";
import type { WalletChainKind } from "@/utils";
import { ALL_CHAIN_FILTER } from "./config";

/** USD value of a token balance using config `price`. Unknown balance is -1 (sort last). */
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

export function chainBalanceUsd<T extends Pick<IntentsToken, "blockchain">>(
  blockchain: string,
  tokens: T[],
  getBalanceUsd: (token: T) => number,
): number {
  let total = 0;
  for (const token of tokens) {
    if (token.blockchain !== blockchain) continue;
    const usd = getBalanceUsd(token);
    if (usd > 0) total += usd;
  }
  return total;
}

/** Funded chains first by total USD, then unfunded. Without balances, keep registry order. */
export function sortChainsForSidebar<T extends Pick<IntentsToken, "blockchain">>(
  chains: ChainConfig[],
  tokens: T[],
  options: {
    showBalances: boolean;
    getBalanceUsd: (token: T) => number;
  },
): ChainConfig[] {
  if (!options.showBalances) return chains.slice();
  return chains.slice().sort((left, right) => {
    const leftUsd = chainBalanceUsd(left.blockchain, tokens, options.getBalanceUsd);
    const rightUsd = chainBalanceUsd(right.blockchain, tokens, options.getBalanceUsd);
    if (rightUsd !== leftUsd) return rightUsd - leftUsd;
    return left.chainName.localeCompare(right.chainName);
  });
}

export function initialChainFilter(
  lockChainKind: WalletChainKind | null | undefined,
  recentBlockchains: readonly string[],
  chains: readonly ChainConfig[] = getRuntimeChains(),
): string {
  if (!lockChainKind) return ALL_CHAIN_FILTER;
  const matching = chains.filter((chain) => chain.chainKind === lockChainKind);
  if (matching.length === 0) return ALL_CHAIN_FILTER;
  for (const code of recentBlockchains) {
    if (matching.some((chain) => chain.blockchain === code)) return code;
  }
  return matching[0].blockchain;
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

const BALANCE_RANK_FUNDED = 0;
const BALANCE_RANK_LOADING = 1;
const BALANCE_RANK_EMPTY = 2;

function tokenBalanceRank(usd: number, loading: boolean): number {
  if (loading) return BALANCE_RANK_LOADING;
  if (usd > 0) return BALANCE_RANK_FUNDED;
  return BALANCE_RANK_EMPTY;
}

export function compareTokensBySymbol<T extends {
  symbol: string;
  chain: { chainName: string };
}>(left: T, right: T): number {
  return left.symbol.localeCompare(right.symbol) || left.chain.chainName.localeCompare(right.chain.chainName);
}

/** Positive USD first, then balances still loading, then zero or unknown. */
export function sortTokensByBalance<T extends {
  symbol: string;
  chain: { chainName: string };
}>(
  tokens: T[],
  getBalanceUsd: (token: T) => number,
  isLoading: (token: T) => boolean,
): T[] {
  return tokens.slice().sort((left, right) => {
    const leftRank = tokenBalanceRank(getBalanceUsd(left), isLoading(left));
    const rightRank = tokenBalanceRank(getBalanceUsd(right), isLoading(right));
    if (leftRank !== rightRank) return leftRank - rightRank;
    if (leftRank === BALANCE_RANK_FUNDED) {
      const byUsd = getBalanceUsd(right) - getBalanceUsd(left);
      if (byUsd !== 0) return byUsd;
    }
    return compareTokensBySymbol(left, right);
  });
}

export function sortTokensBySymbol<T extends {
  symbol: string;
  chain: { chainName: string };
}>(tokens: T[]): T[] {
  return tokens.slice().sort(compareTokensBySymbol);
}

export function positiveBalanceTokens<T extends {
  symbol: string;
  chain: { chainName: string };
}>(
  tokens: T[],
  getBalanceUsd: (token: T) => number,
): T[] {
  return sortTokensByBalance(
    tokens.filter((token) => getBalanceUsd(token) > 0),
    getBalanceUsd,
    () => false,
  );
}

export function recentTokensInOrder<T extends { assetId: string }>(
  tokens: T[],
  recentAssetIds: readonly string[],
): T[] {
  const byId = new Map(tokens.map((token) => [token.assetId, token]));
  const result: T[] = [];
  for (const assetId of recentAssetIds) {
    const token = byId.get(assetId);
    if (token) result.push(token);
  }
  return result;
}
