import * as squads from "@sqds/multisig";
import { PublicKey } from "@solana/web3.js";
import { getSolanaConnection } from "@/lib/rpc/solana";
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

export async function watchSquadsProposal(input: {
  multisigPda: string;
  transactionIndex: bigint;
  signal?: AbortSignal;
}): Promise<void> {
  const connection = getSolanaConnection();
  const [proposalPda] = squads.getProposalPda({
    multisigPda: new PublicKey(input.multisigPda),
    transactionIndex: input.transactionIndex,
  });
  while (!input.signal?.aborted) {
    try {
      const proposal = await squads.accounts.Proposal.fromAccountAddress(connection, proposalPda);
      if (isSquadsProposalTerminal(proposal.status)) return;
    } catch (error) {
      if (input.signal?.aborted) throw error;
    }
    await wait(SQUADS_PROPOSAL_POLL_MS, input.signal);
  }
  throw new DOMException("Aborted", "AbortError");
}
