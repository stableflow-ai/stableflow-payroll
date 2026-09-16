/**
 * Safe account detection.
 *
 * The Safe App connector is identifiable by its wagmi id, but a Safe reached over
 * WalletConnect looks exactly like any other WalletConnect wallet. The only
 * reliable test is on-chain: the connected address holds code and answers the Safe
 * read interface. That test works for both shapes, so it is the single source of
 * truth and no Safe hosted service or API key is involved.
 */

import type { Address } from "viem";
import { getConnections } from "wagmi/actions";
import { getPublicClientForChainId } from "../balance";
import { wagmiConfig } from "../config";
import { safeReadAbi } from "./abi";
import { SAFE_CONNECTOR_ID } from "./config";
import type { SafeMode } from "./types";

/** True when the page is framed, which is the only context the Safe App runs in. */
export function isSafeAppEnv(): boolean {
  return typeof window !== "undefined" && window.parent !== window;
}

function cacheKey(chainId: number, address: string): string {
  return `${chainId}:${address.toLowerCase()}`;
}

const knownSafes = new Set<string>();
/**
 * Addresses proven to hold no bytecode. Safe to remember: nothing can be deployed
 * to an address whose private key someone is signing with, so this cannot go stale
 * while the wallet is connected.
 *
 * A contract that merely failed the Safe reads is deliberately not cached — that
 * failure may have been the RPC, and treating a real Safe as an EOA would send the
 * code down a path that waits for a receipt on a hash that will never be mined.
 */
const knownNonContracts = new Set<string>();
const inFlight = new Map<string, Promise<boolean>>();

async function probeSafeAccount(chainId: number, address: Address, key: string): Promise<boolean> {
  const client = getPublicClientForChainId(chainId);
  if (!client) return false;

  const code = await client.getCode({ address });
  if (!code || code === "0x") {
    knownNonContracts.add(key);
    return false;
  }

  try {
    await Promise.all([
      client.readContract({ address, abi: safeReadAbi, functionName: "VERSION" }),
      client.readContract({ address, abi: safeReadAbi, functionName: "getThreshold" }),
    ]);
  } catch {
    return false;
  }
  return true;
}

/** Whether `address` is a Safe on `chainId`. Concurrent calls share one probe. */
export async function isSafeAccount(input: { chainId: number; address: Address }): Promise<boolean> {
  const key = cacheKey(input.chainId, input.address);
  if (knownSafes.has(key)) return true;
  if (knownNonContracts.has(key)) return false;

  const pending = inFlight.get(key);
  if (pending) return pending;

  const probe = probeSafeAccount(input.chainId, input.address, key)
    .then((isSafe) => {
      if (isSafe) knownSafes.add(key);
      return isSafe;
    })
    .catch(() => false)
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, probe);
  return probe;
}

/**
 * Which Safe shape the current connection is, or `null` for a plain EOA.
 *
 * Module-level so the broadcast and transfer layers can branch without React.
 */
export async function activeSafeMode(): Promise<SafeMode | null> {
  const [connection] = getConnections(wagmiConfig);
  if (!connection) return null;
  if (connection.connector.id === SAFE_CONNECTOR_ID) return "app";

  const address = connection.accounts[0];
  if (!address) return null;
  const isSafe = await isSafeAccount({ chainId: connection.chainId, address });
  return isSafe ? "walletconnect" : null;
}
