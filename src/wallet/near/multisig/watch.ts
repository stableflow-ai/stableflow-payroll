import { nearViewFunction } from "@/lib/rpc/near";
import { PROPOSAL_WATCH_INTERVAL_MS } from "./config";
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

export async function watchNearProposal(input: {
  daoId: string;
  proposalId: number;
  signal?: AbortSignal;
}): Promise<void> {
  while (!input.signal?.aborted) {
    try {
      const proposal = await nearViewFunction<SputnikProposal>(
        input.daoId,
        "get_proposal",
        { id: input.proposalId },
      );
      if (proposal && isNearProposalTerminal(proposal.status)) return;
    } catch (error) {
      if (input.signal?.aborted) throw error;
    }
    await wait(PROPOSAL_WATCH_INTERVAL_MS, input.signal);
  }
  throw new DOMException("Aborted", "AbortError");
}
