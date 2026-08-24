/**
 * Chain registry for Stableflow Pay payments.
 * EVM plus Near / Solana / Tron. Token availability still comes from 1Click /v0/tokens.
 */

import { chainLogoUrl } from "@/lib/logo";

export type ChainKind = "evm" | "near" | "solana" | "tron" | "other";

export interface ChainConfig {
  /** 1Click blockchain code (e.g. arb, base). */
  blockchain: string;
  /** Display name used in UI / legacy employee.network. */
  chainName: string;
  chainKind: ChainKind;
  /** EVM chain id when applicable. */
  chainId?: number;
  logo: string;
}

/** Registered chains supporting USDT/USDC via 1Click. */
export const FIXED_CHAINS: ChainConfig[] = [
  { blockchain: "eth", chainName: "Ethereum", chainKind: "evm", chainId: 1, logo: chainLogoUrl("eth") },
  { blockchain: "base", chainName: "Base", chainKind: "evm", chainId: 8453, logo: chainLogoUrl("base") },
  { blockchain: "arb", chainName: "Arbitrum", chainKind: "evm", chainId: 42161, logo: chainLogoUrl("arb") },
  { blockchain: "op", chainName: "Optimism", chainKind: "evm", chainId: 10, logo: chainLogoUrl("op") },
  { blockchain: "pol", chainName: "Polygon", chainKind: "evm", chainId: 137, logo: chainLogoUrl("pol") },
  { blockchain: "bsc", chainName: "BNB Chain", chainKind: "evm", chainId: 56, logo: chainLogoUrl("bsc") },
  { blockchain: "avax", chainName: "Avalanche", chainKind: "evm", chainId: 43114, logo: chainLogoUrl("avax") },
  { blockchain: "gnosis", chainName: "Gnosis", chainKind: "evm", chainId: 100, logo: chainLogoUrl("gnosis") },
  { blockchain: "monad", chainName: "Monad", chainKind: "evm", chainId: 143, logo: chainLogoUrl("monad") },
  // { blockchain: "scroll", chainName: "Scroll", chainKind: "evm", chainId: 534352, logo: chainLogoUrl("scroll") },
  // { blockchain: "xlayer", chainName: "X Layer", chainKind: "evm", chainId: 196, logo: chainLogoUrl("xlayer") },
  { blockchain: "plasma", chainName: "Plasma", chainKind: "evm", chainId: 9745, logo: chainLogoUrl("plasma") },
  { blockchain: "bera", chainName: "Berachain", chainKind: "evm", chainId: 80094, logo: chainLogoUrl("bera") },
  { blockchain: "near", chainName: "Near", chainKind: "near", logo: chainLogoUrl("near") },
  { blockchain: "sol", chainName: "Solana", chainKind: "solana", logo: chainLogoUrl("sol") },
  { blockchain: "tron", chainName: "Tron", chainKind: "tron", logo: chainLogoUrl("tron") },
];

export const PAYOUT_NETWORKS = new Set(FIXED_CHAINS.map((c) => c.chainName));

export const EVM_BLOCKCHAINS = FIXED_CHAINS
  .filter((chain) => chain.chainKind === "evm")
  .map((chain) => chain.blockchain);

export function chainKindForNetwork(network: string): ChainKind | null {
  return getChainByNetwork(network)?.chainKind ?? null;
}

const byBlockchain = new Map(FIXED_CHAINS.map((c) => [c.blockchain, c]));
const byChainName = new Map(FIXED_CHAINS.map((c) => [c.chainName.toLowerCase(), c]));

/** CSV / Sheets aliases → 1Click blockchain codes. */
const NETWORK_ALIASES: Record<string, string> = {
  ethereum: "eth",
  mainnet: "eth",
  "eth mainnet": "eth",
  polygon: "pol",
  matic: "pol",
  "polygon pos": "pol",
  "arbitrum one": "arb",
  arbitrum: "arb",
  binance: "bsc",
  bnb: "bsc",
  "binance smart chain": "bsc",
  "bnb chain": "bsc",
  avalanche: "avax",
  "avalanche c-chain": "avax",
  solana: "sol",
  "near protocol": "near",
  trx: "tron",
  "tron network": "tron",
};

export function getChainByBlockchain(blockchain: string): ChainConfig | undefined {
  return byBlockchain.get(blockchain);
}

export function getChainByNetwork(network: string): ChainConfig | undefined {
  const key = String(network || "").trim().toLowerCase();
  if (!key) return undefined;
  const aliased = NETWORK_ALIASES[key];
  return byChainName.get(key)
    || byBlockchain.get(key)
    || (aliased ? byBlockchain.get(aliased) ?? byChainName.get(aliased) : undefined);
}

export function chainDisplayName(network: string): string {
  return getChainByNetwork(network)?.chainName ?? String(network || "").trim();
}

export function networkToChainId(network: string): number | null {
  return getChainByNetwork(network)?.chainId ?? null;
}
