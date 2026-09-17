/**
 * Watch one Squads v4 proposal until it is executed, rejected, or cancelled.
 *
 * n is `proposal.approved.length`. m is `multisig.threshold`. SquadsX wraps
 * without a transaction index and cannot use this watcher. See doc/multisig.md.
 */

import * as squads from "@sqds/multisig";
import { PublicKey } from "@solana/web3.js";
import { getSolanaConnection } from "@/lib/rpc/solana";
import { wait } from "../../multisig/wait";
import {
  MULTISIG_WATCH_STATUS,
  type MultisigWatchSnapshot,
} from "../../multisig/types";
import { SQUADS_PROPOSAL_POLL_MS } from "./config";

const TERMINAL_KINDS = new Set(["Executed", "Rejected", "Cancelled"]);

export function squadsProposalStatusKind(status: unknown): string {
  if (!status) return "";
  if (typeof status === "string") return status;
  if (typeof status === "object") {
    const tagged = status as { __kind?: string };
    if (tagged.__kind) return tagged.__kind;
    const key = Object.keys(status)[0];
    if (key) return key;
  }
  return "";
}

export function isSquadsProposalTerminal(status: unknown): boolean {
  return TERMINAL_KINDS.has(squadsProposalStatusKind(status));
}

export function isSquadsProposalExecuted(status: unknown): boolean {
  return squadsProposalStatusKind(status) === "Executed";
}

export function snapshotFromSquadsProposal(
  approvedCount: number | null,
  threshold: number | null,
  status: unknown,
): MultisigWatchSnapshot {
  if (isSquadsProposalExecuted(status)) {
    return {
      signed: approvedCount,
      required: threshold,
      status: MULTISIG_WATCH_STATUS.Success,
      txHash: null,
    };
  }
  if (isSquadsProposalTerminal(status)) {
    return {
      signed: approvedCount,
      required: threshold,
      status: MULTISIG_WATCH_STATUS.Failed,
      txHash: null,
    };
  }
  return {
    signed: approvedCount,
    required: threshold,
    status: MULTISIG_WATCH_STATUS.Pending,
    txHash: null,
  };
}

export async function watchSquadsProposal(input: {
  multisigPda: string;
  transactionIndex: bigint;
  onUpdate?: (snap: MultisigWatchSnapshot) => void;
  signal?: AbortSignal;
}): Promise<MultisigWatchSnapshot> {
  const connection = getSolanaConnection();
  const multisigPda = new PublicKey(input.multisigPda);
  const [proposalPda] = squads.getProposalPda({
    multisigPda,
    transactionIndex: input.transactionIndex,
  });
  while (!input.signal?.aborted) {
    try {
      const [proposal, account] = await Promise.all([
        squads.accounts.Proposal.fromAccountAddress(connection, proposalPda),
        squads.accounts.Multisig.fromAccountAddress(connection, multisigPda),
      ]);
      const snap = snapshotFromSquadsProposal(
        Array.isArray(proposal.approved) ? proposal.approved.length : null,
        Number.isFinite(account.threshold) ? account.threshold : null,
        proposal.status,
      );
      input.onUpdate?.(snap);
      if (snap.status !== MULTISIG_WATCH_STATUS.Pending) return snap;
    } catch (error) {
      if (input.signal?.aborted) throw error;
    }
    await wait(SQUADS_PROPOSAL_POLL_MS, input.signal);
  }
  throw new DOMException("Aborted", "AbortError");
}
