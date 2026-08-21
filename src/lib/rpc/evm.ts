import { fallback, http, type Transport } from "viem";
import { getChainRpc, isProxyRpcUrl, rpcUrlsFor } from "./chain-rpc";
import { generateRpcSignature } from "./signature";

function signedHttp(url: string, slug: string | null) {
  const useSignature = Boolean(slug) && isProxyRpcUrl(url);
  return http(url, useSignature
    ? {
        onFetchRequest(_request, init) {
          const { headers } = generateRpcSignature(slug!);
          return {
            ...init,
            headers: {
              ...(init.headers as Record<string, string> | undefined),
              ...headers,
            },
          };
        },
      }
    : undefined);
}

export function evmTransportForBlockchain(blockchain: string): Transport {
  const config = getChainRpc(blockchain);
  const urls = rpcUrlsFor(blockchain);
  if (urls.length === 0) return http();
  const transports = urls.map((url) => signedHttp(url, config?.proxySlug ?? null));
  return transports.length === 1 ? transports[0] : fallback(transports);
}
