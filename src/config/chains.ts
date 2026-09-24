/**
 * Chain registry for Stableflow Pay payments.
 * Runtime lists come from GET /v1/pay/config; this file keeps UI metadata
 * and a fail-open fallback.
 */

import { chainLogoUrl } from "@/lib/logo";
import type { ChainKind } from "@/wallet/types";

export interface ChainConfig {
  /** Backend / 1Click blockchain code (e.g. arb, base). */
  blockchain: string;
  /** Display name used in UI / legacy employee.network. */
  chainName: string;
  chainKind: ChainKind;
  /** EVM chain id when applicable. */
  chainId?: number;
  logo: string;
  /** When false, this chain cannot be used as the batch origin. */
  batchEnabled: boolean;
  /** Block explorer prefix for a transaction hash (ends with `/`). */
  txExplorer: string;
  /**
   * EIP-3770 short name, needed to address a Safe in Safe{Wallet} links. Left unset
   * for chains Safe{Wallet} does not list, which suppresses the link entirely.
   */
  safeShortName?: string;
}

interface ChainMeta {
  chainKind: ChainKind;
  safeShortName?: string;
  /** Batch origin. The pay config API does not send this. */
  batchEnabled: boolean;
}

/** Frontend-only fields the config API does not send. */
export const CHAIN_META: Record<string, ChainMeta> = {
  eth: { chainKind: "evm", safeShortName: "eth", batchEnabled: true },
  base: { chainKind: "evm", safeShortName: "base", batchEnabled: true },
  arb: { chainKind: "evm", safeShortName: "arb1", batchEnabled: true },
  op: { chainKind: "evm", safeShortName: "oeth", batchEnabled: true },
  pol: { chainKind: "evm", safeShortName: "matic", batchEnabled: true },
  bsc: { chainKind: "evm", safeShortName: "bnb", batchEnabled: true },
  avax: { chainKind: "evm", safeShortName: "avax", batchEnabled: true },
  gnosis: { chainKind: "evm", safeShortName: "gno", batchEnabled: true },
  scroll: { chainKind: "evm", safeShortName: "scr", batchEnabled: true },
  xlayer: { chainKind: "evm", batchEnabled: true },
  bera: { chainKind: "evm", batchEnabled: true },
  near: { chainKind: "near", batchEnabled: true },
  sol: { chainKind: "solana", batchEnabled: true },
  tron: { chainKind: "tron", batchEnabled: true },
  zec: { chainKind: "zec", batchEnabled: false },
};

/** Fail-open fallback when config has never loaded. */
export const FIXED_CHAINS: ChainConfig[] = [
  { blockchain: "eth", chainName: "Ethereum", chainKind: "evm", chainId: 1, logo: chainLogoUrl("eth"), batchEnabled: true, safeShortName: "eth", txExplorer: "https://etherscan.io/tx/" },
  { blockchain: "base", chainName: "Base", chainKind: "evm", chainId: 8453, logo: chainLogoUrl("base"), batchEnabled: true, safeShortName: "base", txExplorer: "https://basescan.org/tx/" },
  { blockchain: "arb", chainName: "Arbitrum", chainKind: "evm", chainId: 42161, logo: chainLogoUrl("arb"), batchEnabled: true, safeShortName: "arb1", txExplorer: "https://arbiscan.io/tx/" },
  { blockchain: "op", chainName: "Optimism", chainKind: "evm", chainId: 10, logo: chainLogoUrl("op"), batchEnabled: true, safeShortName: "oeth", txExplorer: "https://optimistic.etherscan.io/tx/" },
  { blockchain: "pol", chainName: "Polygon", chainKind: "evm", chainId: 137, logo: chainLogoUrl("pol"), batchEnabled: true, safeShortName: "matic", txExplorer: "https://polygonscan.com/tx/" },
  { blockchain: "bsc", chainName: "BNB Chain", chainKind: "evm", chainId: 56, logo: chainLogoUrl("bsc"), batchEnabled: true, safeShortName: "bnb", txExplorer: "https://bscscan.com/tx/" },
  { blockchain: "avax", chainName: "Avalanche", chainKind: "evm", chainId: 43114, logo: chainLogoUrl("avax"), batchEnabled: true, safeShortName: "avax", txExplorer: "https://snowscan.xyz/tx/" },
  { blockchain: "gnosis", chainName: "Gnosis", chainKind: "evm", chainId: 100, logo: chainLogoUrl("gnosis"), batchEnabled: true, safeShortName: "gno", txExplorer: "https://gnosisscan.io/tx/" },
  { blockchain: "scroll", chainName: "Scroll", chainKind: "evm", chainId: 534352, logo: chainLogoUrl("scroll"), batchEnabled: true, safeShortName: "scr", txExplorer: "https://scrollscan.com/tx/" },
  { blockchain: "xlayer", chainName: "X Layer", chainKind: "evm", chainId: 196, logo: chainLogoUrl("xlayer"), batchEnabled: true, txExplorer: "https://www.okx.com/web3/explorer/xlayer/tx/" },
  { blockchain: "bera", chainName: "Berachain", chainKind: "evm", chainId: 80094, logo: chainLogoUrl("bera"), batchEnabled: true, txExplorer: "https://berascan.com/tx/" },
  { blockchain: "near", chainName: "Near", chainKind: "near", logo: chainLogoUrl("near"), batchEnabled: true, txExplorer: "https://nearblocks.io/txns/" },
  { blockchain: "sol", chainName: "Solana", chainKind: "solana", logo: chainLogoUrl("sol"), batchEnabled: true, txExplorer: "https://solscan.io/tx/" },
  { blockchain: "tron", chainName: "Tron", chainKind: "tron", logo: chainLogoUrl("tron"), batchEnabled: true, txExplorer: "https://tronscan.org/#/transaction/" },
  { blockchain: "zec", chainName: "Zcash", chainKind: "zec", logo: chainLogoUrl("zec"), batchEnabled: false, txExplorer: "https://explorer.zcha.in/transactions/" },
];

export const PAYOUT_NETWORKS = new Set(FIXED_CHAINS.map((c) => c.chainName));

export const EVM_BLOCKCHAINS = FIXED_CHAINS
  .filter((chain) => chain.chainKind === "evm")
  .map((chain) => chain.blockchain);

/** CSV / Sheets aliases → blockchain codes. */
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
  zcash: "zec",
};

export const CHAIN_KIND_LEBALS: Record<ChainKind, string> = {
  evm: "EVM",
  near: "Near",
  solana: "Solana",
  tron: "Tron",
  zec: "Zcash",
};

export function chainLabel(kind: ChainKind): string {
  return CHAIN_KIND_LEBALS[kind] || kind;
}

export const FIXED_CHAIN_KINDS = new Map<ChainKind, { chainKindLabel: string; chainKind: ChainKind }>();

let runtimeChains: ChainConfig[] = FIXED_CHAINS;
let byBlockchain = new Map<string, ChainConfig>();
let byChainName = new Map<string, ChainConfig>();
let byChainId = new Map<number, ChainConfig>();

function rebuildLookups(chains: ChainConfig[]) {
  byBlockchain = new Map(chains.map((chain) => [chain.blockchain, chain]));
  byChainName = new Map(chains.map((chain) => [chain.chainName.toLowerCase(), chain]));
  byChainId = new Map(
    chains
      .filter((chain): chain is ChainConfig & { chainId: number } => chain.chainId != null)
      .map((chain) => [chain.chainId, chain]),
  );
  FIXED_CHAIN_KINDS.clear();
  for (const chain of chains) {
    if (FIXED_CHAIN_KINDS.has(chain.chainKind)) continue;
    FIXED_CHAIN_KINDS.set(chain.chainKind, {
      chainKind: chain.chainKind,
      chainKindLabel: chainLabel(chain.chainKind),
    });
  }
}

rebuildLookups(FIXED_CHAINS);

export function getRuntimeChains(): ChainConfig[] {
  return runtimeChains;
}

export function setRuntimeChains(chains: ChainConfig[]) {
  runtimeChains = chains.length > 0 ? chains : FIXED_CHAINS;
  rebuildLookups(runtimeChains);
}

export function getBatchBlockchains(): string[] {
  return getRuntimeChains()
    .filter((chain) => chain.batchEnabled)
    .map((chain) => chain.blockchain);
}

export function mergeApiChain(input: {
  network: string;
  chainId: string;
  chainName: string;
  logo: string;
  explorer: string;
}): ChainConfig | null {
  const network = input.network.trim();
  if (!network) return null;
  const chainIdRaw = input.chainId.trim();
  const parsedId = chainIdRaw ? Number(chainIdRaw) : NaN;
  const chainId = Number.isFinite(parsedId) ? parsedId : undefined;
  const meta = CHAIN_META[network];
  const chainKind = meta?.chainKind ?? (chainId != null ? "evm" : null);
  if (!chainKind) return null;
  return {
    blockchain: network,
    chainName: input.chainName.trim() || network,
    chainKind,
    chainId,
    logo: input.logo.trim() || chainLogoUrl(network),
    batchEnabled: meta?.batchEnabled ?? true,
    txExplorer: input.explorer.trim(),
    safeShortName: meta?.safeShortName,
  };
}

export function mergeApiChains(rows: Array<{
  network: string;
  chainId: string;
  chainName: string;
  logo: string;
  explorer: string;
}>): ChainConfig[] {
  const out: ChainConfig[] = [];
  for (const row of rows) {
    const chain = mergeApiChain(row);
    if (chain) out.push(chain);
  }
  return out;
}

export function chainKindForNetwork(network: string): ChainKind | null {
  return getChainByNetwork(network)?.chainKind ?? null;
}

export function getChainByBlockchain(blockchain: string): ChainConfig | undefined {
  return byBlockchain.get(blockchain);
}

export function getChainByChainId(chainId: number): ChainConfig | undefined {
  return byChainId.get(chainId);
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

/**
 * Safe{Wallet} queue for one Safe. `null` when the chain has no EIP-3770 short
 * name, since the address cannot be expressed without one.
 */
export function safeQueueUrl(chainId: number, safeAddress: string): string | null {
  const shortName = getChainByChainId(chainId)?.safeShortName;
  const address = safeAddress.trim();
  if (!shortName || !address) return null;
  return `https://app.safe.global/transactions/queue?safe=${shortName}:${address}`;
}

/**
 * Trezu request queue for one SputnikDAO. Pass `proposalId` for the specific
 * request, or omit it for the DAO's request list.
 */
export function trezuRequestsUrl(daoId: string, proposalId?: number): string | null {
  const id = daoId.trim();
  if (!id) return null;
  if (proposalId == null || !Number.isFinite(proposalId) || proposalId < 0) {
    return `https://trezu.app/${id}/requests`;
  }
  return `https://trezu.app/${id}/requests/${proposalId}`;
}

/**
 * Squads app transaction list for one vault. Links the list, not a single
 * proposal, because SquadsX wrap hashes are not the vault transaction index.
 */
export function squadsQueueUrl(vaultAddress: string): string | null {
  const address = vaultAddress.trim();
  if (!address) return null;
  return `https://app.squads.so/squads/${encodeURIComponent(address)}/transactions`;
}

export function txExplorerUrl(network: string, txHash: string | null | undefined): string | null {
  const hash = String(txHash || "").trim();
  if (!hash) return null;
  const prefix = getChainByNetwork(network)?.txExplorer;
  if (!prefix) return null;
  return `${prefix}${hash}`;
}
