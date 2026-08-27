/**
 * Chain registry for Stableflow Pay payments.
 * EVM plus Near / Solana / Tron. Token availability still comes from 1Click /v0/tokens.
 */

import { chainLogoUrl } from "@/lib/logo";
import type { ChainKind } from "@/wallet/types";

export interface ChainConfig {
  /** 1Click blockchain code (e.g. arb, base). */
  blockchain: string;
  /** Display name used in UI / legacy employee.network. */
  chainName: string;
  chainKind: ChainKind;
  /** EVM chain id when applicable. */
  chainId?: number;
  logo: string;
  /** When false, this chain cannot be used as the payer / origin token. */
  payerEnabled: boolean;
  /** When false, this chain cannot be used as the batch origin. */
  batchEnabled: boolean;
  /** Block explorer prefix for a transaction hash (ends with `/`). */
  txExplorer: string;
}

/** Registered chains. Token availability still comes from 1Click /v0/tokens. */
export const FIXED_CHAINS: ChainConfig[] = [
  { blockchain: "eth", chainName: "Ethereum", chainKind: "evm", chainId: 1, logo: chainLogoUrl("eth"), payerEnabled: true, batchEnabled: true, txExplorer: "https://etherscan.io/tx/" },
  { blockchain: "base", chainName: "Base", chainKind: "evm", chainId: 8453, logo: chainLogoUrl("base"), payerEnabled: true, batchEnabled: true, txExplorer: "https://basescan.org/tx/" },
  { blockchain: "arb", chainName: "Arbitrum", chainKind: "evm", chainId: 42161, logo: chainLogoUrl("arb"), payerEnabled: true, batchEnabled: true, txExplorer: "https://arbiscan.io/tx/" },
  { blockchain: "op", chainName: "Optimism", chainKind: "evm", chainId: 10, logo: chainLogoUrl("op"), payerEnabled: true, batchEnabled: true, txExplorer: "https://optimistic.etherscan.io/tx/" },
  { blockchain: "pol", chainName: "Polygon", chainKind: "evm", chainId: 137, logo: chainLogoUrl("pol"), payerEnabled: true, batchEnabled: true, txExplorer: "https://polygonscan.com/tx/" },
  { blockchain: "bsc", chainName: "BNB Chain", chainKind: "evm", chainId: 56, logo: chainLogoUrl("bsc"), payerEnabled: true, batchEnabled: true, txExplorer: "https://bscscan.com/tx/" },
  { blockchain: "avax", chainName: "Avalanche", chainKind: "evm", chainId: 43114, logo: chainLogoUrl("avax"), payerEnabled: true, batchEnabled: true, txExplorer: "https://snowscan.xyz/tx/" },
  { blockchain: "gnosis", chainName: "Gnosis", chainKind: "evm", chainId: 100, logo: chainLogoUrl("gnosis"), payerEnabled: true, batchEnabled: true, txExplorer: "https://gnosisscan.io/tx/" },
  { blockchain: "monad", chainName: "Monad", chainKind: "evm", chainId: 143, logo: chainLogoUrl("monad"), payerEnabled: true, batchEnabled: true, txExplorer: "https://monadvision.com/tx/" },
  { blockchain: "scroll", chainName: "Scroll", chainKind: "evm", chainId: 534352, logo: chainLogoUrl("scroll"), payerEnabled: true, batchEnabled: true, txExplorer: "https://scrollscan.com/tx/" },
  { blockchain: "xlayer", chainName: "X Layer", chainKind: "evm", chainId: 196, logo: chainLogoUrl("xlayer"), payerEnabled: true, batchEnabled: true, txExplorer: "https://www.okx.com/web3/explorer/xlayer/tx/" },
  // { blockchain: "plasma", chainName: "Plasma", chainKind: "evm", chainId: 9745, logo: chainLogoUrl("plasma"), payerEnabled: true, batchEnabled: true, txExplorer: "https://plasmascan.to/tx/" },
  { blockchain: "bera", chainName: "Berachain", chainKind: "evm", chainId: 80094, logo: chainLogoUrl("bera"), payerEnabled: true, batchEnabled: true, txExplorer: "https://berascan.com/tx/" },
  { blockchain: "near", chainName: "Near", chainKind: "near", logo: chainLogoUrl("near"), payerEnabled: true, batchEnabled: false, txExplorer: "https://nearblocks.io/txns/" },
  { blockchain: "sol", chainName: "Solana", chainKind: "solana", logo: chainLogoUrl("sol"), payerEnabled: true, batchEnabled: false, txExplorer: "https://solscan.io/tx/" },
  { blockchain: "tron", chainName: "Tron", chainKind: "tron", logo: chainLogoUrl("tron"), payerEnabled: true, batchEnabled: false, txExplorer: "https://tronscan.org/#/transaction/" },
];

export const PAYOUT_NETWORKS = new Set(FIXED_CHAINS.map((c) => c.chainName));

export const EVM_BLOCKCHAINS = FIXED_CHAINS
  .filter((chain) => chain.chainKind === "evm")
  .map((chain) => chain.blockchain);

export const PAYER_BLOCKCHAINS = FIXED_CHAINS
  .filter((chain) => chain.payerEnabled)
  .map((chain) => chain.blockchain);

export const BATCH_BLOCKCHAINS = FIXED_CHAINS
  .filter((chain) => chain.batchEnabled)
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

export function txExplorerUrl(network: string, txHash: string | null | undefined): string | null {
  const hash = String(txHash || "").trim();
  if (!hash) return null;
  const prefix = getChainByNetwork(network)?.txExplorer;
  if (!prefix) return null;
  return `${prefix}${hash}`;
}

export const CHAIN_KIND_LEBALS: Record<ChainKind, string> = {
  "evm": "EVM",
  "near": "Near",
  "solana": "Solana",
  "tron": "Tron",
};
export function chainLabel(kind: ChainKind): string {
  return CHAIN_KIND_LEBALS[kind] || kind;
}

export const FIXED_CHAIN_KINDS = new Map<ChainKind, { chainKindLabel: string; chainKind: ChainKind; }>();
for (const chain of FIXED_CHAINS) {
  if (FIXED_CHAIN_KINDS.has(chain.chainKind)) {
    continue;
  }
  if (!chain.payerEnabled) {
    continue;
  }
  FIXED_CHAIN_KINDS.set(chain.chainKind, {
    chainKind: chain.chainKind,
    chainKindLabel: chainLabel(chain.chainKind),
  })
}
