/**
 * Propose a Squads vault transaction by sending the original transfer through
 * SquadsX. The wallet wraps it; this layer only waits for that wrap to land.
 */

import type { Transaction, VersionedTransaction } from "@solana/web3.js";
import { pendingSquadsMultisigBroadcast, type BroadcastResult } from "../../types";
import { getSolanaSigner } from "../session";
import { broadcastSolanaTransaction } from "../transfer";

export async function sendViaSquads(
  transaction: Transaction | VersionedTransaction,
): Promise<BroadcastResult> {
  const signer = getSolanaSigner();
  if (!signer) throw new Error("Connect a Solana wallet to send this payout");
  await broadcastSolanaTransaction(transaction);
  return pendingSquadsMultisigBroadcast({ vaultAddress: signer.publicKey.toBase58() });
}
