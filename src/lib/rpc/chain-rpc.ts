/**
 * RPC endpoint registry.
 *
 * Proxy is preferred when `proxySlug` is set. scroll, monad, and near have no
 * proxy today (`proxySlug: null`); add a slug here when the backend enables them.
 */

export type RpcChainKind = "evm" | "solana" | "near" | "tron";

export interface ChainRpcConfig {
  blockchain: string;
  kind: RpcChainKind;
  /** HMAC proxy path segment, or null when the proxy does not serve this chain. */
  proxySlug: string | null;
  publicUrls: string[];
}

function proxyHost(): string {
  return (import.meta.env.VITE_RPC_PROXY_HOST || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function proxyRpcUrl(slug: string): string | null {
  const host = proxyHost();
  if (!host) return null;
  return `https://${host}/rpc/${slug}`;
}

export function isProxyRpcUrl(url: string): boolean {
  const host = proxyHost();
  return Boolean(host) && url.includes(host);
}

export const CHAIN_RPC: Record<string, ChainRpcConfig> = {
  eth: {
    blockchain: "eth",
    kind: "evm",
    proxySlug: "ethereum",
    publicUrls: ["https://0xrpc.io/eth", "https://ethereum-rpc.publicnode.com"],
  },
  base: {
    blockchain: "base",
    kind: "evm",
    proxySlug: "base",
    publicUrls: ["https://mainnet.base.org", "https://base-rpc.publicnode.com"],
  },
  arb: {
    blockchain: "arb",
    kind: "evm",
    proxySlug: "arbitrum",
    publicUrls: ["https://arb1.arbitrum.io/rpc", "https://arbitrum-one-rpc.publicnode.com"],
  },
  op: {
    blockchain: "op",
    kind: "evm",
    proxySlug: "optimism",
    publicUrls: ["https://mainnet.optimism.io", "https://optimism-rpc.publicnode.com"],
  },
  pol: {
    blockchain: "pol",
    kind: "evm",
    proxySlug: "polygon",
    publicUrls: ["https://polygon.drpc.org", "https://polygon-bor-rpc.publicnode.com"],
  },
  bsc: {
    blockchain: "bsc",
    kind: "evm",
    proxySlug: "bsc",
    publicUrls: ["https://56.rpc.thirdweb.com", "https://bsc-rpc.publicnode.com"],
  },
  avax: {
    blockchain: "avax",
    kind: "evm",
    proxySlug: "avalanche",
    publicUrls: ["https://api.avax.network/ext/bc/C/rpc", "https://avalanche-c-chain-rpc.publicnode.com"],
  },
  gnosis: {
    blockchain: "gnosis",
    kind: "evm",
    proxySlug: "gnosis",
    publicUrls: ["https://rpc.gnosischain.com", "https://gnosis-rpc.publicnode.com"],
  },
  xlayer: {
    blockchain: "xlayer",
    kind: "evm",
    proxySlug: "xlayer",
    publicUrls: ["https://rpc.xlayer.tech", "https://xlayer.drpc.org"],
  },
  plasma: {
    blockchain: "plasma",
    kind: "evm",
    proxySlug: "plasma",
    publicUrls: ["https://rpc.plasma.to", "https://plasma.drpc.org"],
  },
  bera: {
    blockchain: "bera",
    kind: "evm",
    proxySlug: "berachain",
    publicUrls: ["https://rpc.berachain.com", "https://berachain-rpc.publicnode.com"],
  },
  // No HMAC proxy for Scroll yet.
  scroll: {
    blockchain: "scroll",
    kind: "evm",
    proxySlug: null,
    publicUrls: ["https://scroll-rpc.publicnode.com", "https://rpc.scroll.io"],
  },
  // No HMAC proxy for Monad yet.
  monad: {
    blockchain: "monad",
    kind: "evm",
    proxySlug: null,
    publicUrls: ["https://rpc.monad.xyz", "https://rpc1.monad.xyz"],
  },
  sol: {
    blockchain: "sol",
    kind: "solana",
    proxySlug: "solana",
    publicUrls: ["https://solana-rpc.publicnode.com"],
  },
  // No HMAC proxy for Near yet. Add a slug and reuse evm.ts-style header injection.
  near: {
    blockchain: "near",
    kind: "near",
    proxySlug: null,
    publicUrls: [
      "https://nearinner.deltarpc.com",
      "https://free.rpc.fastnear.com",
      "https://rpc.mainnet.near.org",
    ],
  },
  // No HMAC proxy for Tron yet.
  tron: {
    blockchain: "tron",
    kind: "tron",
    proxySlug: null,
    publicUrls: ["https://api.trongrid.io"],
  },
};

export function rpcUrlsFor(blockchain: string): string[] {
  const config = CHAIN_RPC[blockchain];
  if (!config) return [];
  const urls: string[] = [];
  if (config.proxySlug) {
    const proxy = proxyRpcUrl(config.proxySlug);
    if (proxy) urls.push(proxy);
  }
  urls.push(...config.publicUrls);
  return urls;
}

export function getChainRpc(blockchain: string): ChainRpcConfig | undefined {
  return CHAIN_RPC[blockchain];
}
