import type { Transaction, VersionedTransaction } from "@solana/web3.js";
import { executedBroadcast, pendingSquadsMultisigBroadcast, type BroadcastResult } from "../../types";
import { isSquadsV4Transaction } from "./detect";
import type { SquadsMode } from "./types";

export function solanaBroadcastResult(input: {
  signature: string;
  signed: Transaction | VersionedTransaction;
  vaultAddress: string;
  squadsMode: SquadsMode | null;
}): BroadcastResult {
  if (input.squadsMode || isSquadsV4Transaction(input.signed)) {
    return pendingSquadsMultisigBroadcast({ vaultAddress: input.vaultAddress });
  }
  return executedBroadcast(input.signature);
}
