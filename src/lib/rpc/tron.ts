/**
 * Tron RPC helper. Builds a TronWeb instance for transactionBuilder /
 * sendRawTransaction. Wallet signing still goes through the adapter.
 */

import { TronWeb } from "tronweb";
import { isProxyRpcUrl, rpcUrlsFor } from "./chain-rpc";
import { generateRpcSignature } from "./signature";

const TRON_FALLBACK_HOST = "https://api.trongrid.io";

let shared: TronWeb | null = null;

export function tronPrimaryRpcUrl(): string {
  return rpcUrlsFor("tron")[0] || TRON_FALLBACK_HOST;
}

export function getTronWeb(): TronWeb {
  const url = tronPrimaryRpcUrl();
  if (!shared) {
    shared = new TronWeb({ fullHost: url });
  }
  if (isProxyRpcUrl(url)) {
    shared.setHeader(generateRpcSignature("tron").headers);
  }
  return shared;
}
