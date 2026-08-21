/**
 * Tron RPC helper. Builds a TronWeb instance for transactionBuilder /
 * sendRawTransaction. Wallet signing still goes through the adapter.
 */

import { TronWeb } from "tronweb";
import { rpcUrlsFor } from "./chain-rpc";

const TRON_FALLBACK_HOST = "https://api.trongrid.io";

let shared: TronWeb | null = null;

export function tronPrimaryRpcUrl(): string {
  return rpcUrlsFor("tron")[0] || TRON_FALLBACK_HOST;
}

export function getTronWeb(): TronWeb {
  if (!shared) {
    shared = new TronWeb({ fullHost: tronPrimaryRpcUrl() });
  }
  return shared;
}
