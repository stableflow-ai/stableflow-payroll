/**
 * Find the SputnikDAO proposal Trezu created from a `signAndSendTransaction`.
 *
 * `get_last_proposal_id` is the next unused id, not the last existing one.
 * Args are ignored: Trezu re-encodes them as base64.
 */

import { nearViewFunction } from "@/lib/rpc/near";
import {
  PROPOSAL_DISCOVER_INTERVAL_MS,
  PROPOSAL_DISCOVER_TIMEOUT_MS,
  TREZU_PROPOSAL_DISCOVER_TIMEOUT_MESSAGE,
} from "./config";
import type { ProposalMatchSpec, SputnikProposal } from "./types";

export function matchSpecFromActions(input: {
  receiverId: string;
  actions: readonly { params: { methodName: string } }[];
}): ProposalMatchSpec {
  return {
    receiverId: input.receiverId,
    methodNames: input.actions.map((action) => action.params.methodName),
  };
}

export function proposalMatches(proposal: SputnikProposal, expected: ProposalMatchSpec): boolean {
  const functionCall = proposal.kind?.FunctionCall;
  if (!functionCall) return false;
  if (functionCall.receiver_id !== expected.receiverId) return false;
  const methods = new Set((functionCall.actions ?? []).map((action) => action.method_name));
  return expected.methodNames.every((name) => methods.has(name));
}

export function pickMatchingProposal(
  proposals: readonly SputnikProposal[],
  expected: ProposalMatchSpec,
): SputnikProposal | null {
  return proposals.find((proposal) => proposalMatches(proposal, expected)) ?? null;
}

export async function snapshotLastProposalId(daoId: string): Promise<number> {
  const nextId = await nearViewFunction<number>(daoId, "get_last_proposal_id");
  const parsed = Number(nextId);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Could not read the DAO proposal counter");
  }
  return parsed;
}

async function wait(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export async function discoverProposal(input: {
  daoId: string;
  fromIndex: number;
  expected: ProposalMatchSpec;
  signal?: AbortSignal;
}): Promise<number> {
  const started = Date.now();
  while (Date.now() - started < PROPOSAL_DISCOVER_TIMEOUT_MS) {
    if (input.signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const proposals = await nearViewFunction<SputnikProposal[]>(
      input.daoId,
      "get_proposals",
      { from_index: input.fromIndex, limit: 20 },
    );
    const match = pickMatchingProposal(proposals ?? [], input.expected);
    if (match) return match.id;
    await wait(PROPOSAL_DISCOVER_INTERVAL_MS, input.signal);
  }
  throw new Error(TREZU_PROPOSAL_DISCOVER_TIMEOUT_MESSAGE);
}
