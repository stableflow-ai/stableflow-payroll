/**
 * NEAR multisig detection.
 *
 * Trezu is identifiable by its near-connect manifest id. A SputnikDAO reached
 * through another wallet is probed on-chain with `get_policy`. That test is the
 * fallback so broadcast can still take the pending path if the connector id is
 * missing, without treating RPC noise as "this is an EOA".
 */

import { nearViewFunction } from "@/lib/rpc/near";
import { getNearConnector } from "../session";
import { TREZU_CONNECTOR_ID } from "./config";
import type { NearMultisigMode, Policy } from "./types";

const knownDaos = new Set<string>();
const inFlight = new Map<string, Promise<boolean>>();

function cacheKey(accountId: string): string {
  return accountId.trim().toLowerCase();
}

async function probeSputnikDao(accountId: string): Promise<boolean> {
  try {
    const policy = await nearViewFunction<Policy>(accountId, "get_policy");
    return Boolean(policy && Array.isArray(policy.roles));
  } catch {
    return false;
  }
}

/** Whether `accountId` answers SputnikDAO `get_policy`. Concurrent calls share one probe. */
export async function isSputnikDao(accountId: string): Promise<boolean> {
  const id = accountId.trim();
  if (!id) return false;
  const key = cacheKey(id);
  if (knownDaos.has(key)) return true;

  const pending = inFlight.get(key);
  if (pending) return pending;

  const probe = probeSputnikDao(id)
    .then((isDao) => {
      if (isDao) knownDaos.add(key);
      return isDao;
    })
    .catch(() => false)
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, probe);
  return probe;
}

/**
 * Which NEAR multisig shape the current connection is, or `null` for a plain
 * named account. Module-level so broadcast can branch without React.
 */
export async function activeNearMultisigMode(): Promise<NearMultisigMode | null> {
  const connector = getNearConnector();
  if (!connector) return null;

  let wallet;
  try {
    wallet = await connector.wallet();
  } catch {
    return null;
  }

  if (wallet.manifest.id === TREZU_CONNECTOR_ID) return "trezu";

  const accountId = (await wallet.getAccounts())[0]?.accountId?.trim();
  if (!accountId) return null;
  return (await isSputnikDao(accountId)) ? "onchain" : null;
}
