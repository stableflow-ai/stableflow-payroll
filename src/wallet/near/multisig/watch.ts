/**
 * Watch one SputnikDAO / Trezu proposal until it leaves InProgress.
 *
 * n is `vote_counts[role][0]` (Approve weight). m is `parseDaoInfo` threshold
 * for the payment-vote role. See doc/multisig.md.
 */

import { nearViewFunction } from "@/lib/rpc/near";
import { wait } from "../../multisig/wait";
import {
  MULTISIG_WATCH_STATUS,
  type MultisigWatchSnapshot,
} from "../../multisig/types";
import { PROPOSAL_WATCH_INTERVAL_MS } from "./config";
import { getNearDaoInfo } from "./info";
import type { SputnikProposal } from "./types";

export function nearProposalStatusKey(status: unknown): string {
  if (typeof status === "string") return status;
  if (status && typeof status === "object") {
    const key = Object.keys(status)[0];
    if (key) return key;
  }
  return "";
}

export function isNearProposalTerminal(status: unknown): boolean {
  const key = nearProposalStatusKey(status);
  return Boolean(key) && key !== "InProgress";
}

export function isNearProposalApproved(status: unknown): boolean {
  return nearProposalStatusKey(status) === "Approved";
}

export function nearProposalApproveCount(proposal: SputnikProposal, roleName: string): number | null {
  const counts = proposal.vote_counts;
  if (!counts || typeof counts !== "object") return null;
  const row = counts[roleName];
  if (!Array.isArray(row) || row.length === 0) return 0;
  const n = typeof row[0] === "number" ? row[0] : Number(row[0]);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function snapshotFromNearProposal(
  proposal: SputnikProposal,
  required: number | null,
  roleName: string | null,
): MultisigWatchSnapshot {
  const signed = roleName ? nearProposalApproveCount(proposal, roleName) : null;
  if (isNearProposalApproved(proposal.status)) {
    return { signed, required, status: MULTISIG_WATCH_STATUS.Success, txHash: null };
  }
  if (isNearProposalTerminal(proposal.status)) {
    return { signed, required, status: MULTISIG_WATCH_STATUS.Failed, txHash: null };
  }
  return { signed, required, status: MULTISIG_WATCH_STATUS.Pending, txHash: null };
}

export async function watchNearProposal(input: {
  daoId: string;
  proposalId: number;
  onUpdate?: (snap: MultisigWatchSnapshot) => void;
  signal?: AbortSignal;
}): Promise<MultisigWatchSnapshot> {
  let required: number | null = null;
  let roleName: string | null = null;
  try {
    const info = await getNearDaoInfo(input.daoId);
    required = info.threshold;
    roleName = info.roleName;
  } catch {
    // Hide n/m when the policy cannot be parsed.
  }

  while (!input.signal?.aborted) {
    try {
      const proposal = await nearViewFunction<SputnikProposal>(
        input.daoId,
        "get_proposal",
        { id: input.proposalId },
      );
      if (proposal) {
        const snap = snapshotFromNearProposal(proposal, required, roleName);
        input.onUpdate?.(snap);
        if (snap.status !== MULTISIG_WATCH_STATUS.Pending) return snap;
      }
    } catch (error) {
      if (input.signal?.aborted) throw error;
    }
    await wait(PROPOSAL_WATCH_INTERVAL_MS, input.signal);
  }
  throw new DOMException("Aborted", "AbortError");
}
