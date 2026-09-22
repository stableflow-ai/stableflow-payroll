/**
 * Dispatch a pending-multisig broadcast to the matching chain watcher.
 *
 * Future chains add a branch here and implement the same snapshot contract.
 * See doc/multisig.md.
 */

import { watchSafeProposal } from "../evm/safe/watch";
import { watchNearProposal } from "../near/multisig/watch";
import { watchSquadsProposal } from "../solana/multisig/watch";
import type { PendingMultisigBroadcast } from "../types";
import { isWatchablePendingMultisig } from "./serialize";
import { MULTISIG_WATCH_STATUS, type MultisigWatchSnapshot } from "./types";

export async function watchMultisigProposal(
  result: PendingMultisigBroadcast,
  onUpdate: (snap: MultisigWatchSnapshot) => void,
  signal: AbortSignal,
): Promise<MultisigWatchSnapshot> {
  if (result.chainKind === "evm") {
    return watchSafeProposal({
      chainId: result.chainId,
      safeAddress: result.safeAddress,
      safeTxHash: result.safeTxHash,
      onUpdate,
      signal,
    });
  }
  if (result.chainKind === "near") {
    return watchNearProposal({
      daoId: result.daoId,
      proposalId: result.proposalId,
      onUpdate,
      signal,
    });
  }
  if (!isWatchablePendingMultisig(result) || !result.multisigPda || result.transactionIndex == null) {
    return {
      signed: null,
      required: null,
      status: MULTISIG_WATCH_STATUS.Success,
      txHash: null,
    };
  }
  return watchSquadsProposal({
    multisigPda: result.multisigPda,
    transactionIndex: result.transactionIndex,
    onUpdate,
    signal,
  });
}

export {
  deserializePendingMultisig,
  isWatchablePendingMultisig,
  pendingMultisigSessionId,
  serializePendingMultisig,
} from "./serialize";
export { resolveMultisigConfirmToast } from "./confirm";
export {
  MULTISIG_FAILED_MESSAGE,
  MULTISIG_LISTEN_TITLE,
  MULTISIG_QUOTE_EXPIRED_MESSAGE,
  MULTISIG_SIGNED_LABEL,
  MULTISIG_SUBMIT_FAILED_MESSAGE,
  MULTISIG_WATCH_STORAGE_KEY,
  txHashForSubmit,
} from "./config";
export { abortOnQuoteDeadline } from "./quote-deadline";
export { MULTISIG_WATCH_STATUS } from "./types";
export type { MultisigConfirmCopy, MultisigWatchSnapshot, MultisigWatchStatus } from "./types";
export type { StoredPendingMultisig } from "./serialize";
