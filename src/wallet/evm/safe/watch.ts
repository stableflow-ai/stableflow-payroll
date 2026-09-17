import { SAFE_CLIENT_GATEWAY_URL, SAFE_PROPOSAL_POLL_MS } from "./config";

const TERMINAL_TX_STATUSES = new Set(["SUCCESS", "FAILED", "CANCELLED"]);

export function isSafeTxStatusTerminal(status: string | null | undefined): boolean {
  if (!status) return false;
  return TERMINAL_TX_STATUSES.has(status.trim().toUpperCase());
}

export function safeClientTransactionUrl(chainId: number, safeAddress: string, safeTxHash: string): string {
  const hash = safeTxHash.trim();
  const safe = safeAddress.trim();
  const id = `multisig_${safe}_${hash}`;
  return `${SAFE_CLIENT_GATEWAY_URL}/v1/chains/${chainId}/transactions/${encodeURIComponent(id)}`;
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

async function readSafeTxStatus(input: {
  chainId: number;
  safeAddress: string;
  safeTxHash: string;
  signal?: AbortSignal;
}): Promise<string | null> {
  const response = await fetch(safeClientTransactionUrl(input.chainId, input.safeAddress, input.safeTxHash), {
    signal: input.signal,
  });
  if (response.status === 404) return null;
  if (!response.ok) return null;
  const body = await response.json() as { txStatus?: string };
  return typeof body.txStatus === "string" ? body.txStatus : null;
}

export async function watchSafeProposal(input: {
  chainId: number;
  safeAddress: string;
  safeTxHash: string;
  signal?: AbortSignal;
}): Promise<void> {
  while (!input.signal?.aborted) {
    try {
      const status = await readSafeTxStatus(input);
      if (isSafeTxStatusTerminal(status)) return;
    } catch (error) {
      if (input.signal?.aborted) throw error;
    }
    await wait(SAFE_PROPOSAL_POLL_MS, input.signal);
  }
  throw new DOMException("Aborted", "AbortError");
}
