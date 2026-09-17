/**
 * Watch one Safe proposal until it is executed, failed, or cancelled.
 *
 * Reads Safe Client Gateway transaction details. `confirmationsRequired` is m,
 * `confirmations.length` is n, and `txHash` is the on-chain hash after SUCCESS.
 * See doc/multisig.md.
 */

import { wait } from "../../multisig/wait";
import {
  MULTISIG_WATCH_STATUS,
  type MultisigWatchSnapshot,
} from "../../multisig/types";
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

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function readCount(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function snapshotFromSafeGatewayBody(body: unknown): MultisigWatchSnapshot {
  const row = asRecord(body) ?? {};
  const statusRaw = typeof row.txStatus === "string" ? row.txStatus.trim().toUpperCase() : "";
  const details = asRecord(row.detailedExecutionInfo);
  const required = details ? readCount(details.confirmationsRequired) : null;
  const submitted = details ? readCount(details.confirmationsSubmitted) : null;
  const confirmations = Array.isArray(details?.confirmations) ? details.confirmations.length : null;
  const signed = confirmations ?? submitted;
  const txHash = typeof row.txHash === "string" && row.txHash.trim() ? row.txHash.trim() : null;
  if (statusRaw === "SUCCESS") {
    return { signed, required, status: MULTISIG_WATCH_STATUS.Success, txHash };
  }
  if (statusRaw === "FAILED" || statusRaw === "CANCELLED") {
    return { signed, required, status: MULTISIG_WATCH_STATUS.Failed, txHash: null };
  }
  return { signed, required, status: MULTISIG_WATCH_STATUS.Pending, txHash: null };
}

async function readSafeGatewayBody(input: {
  chainId: number;
  safeAddress: string;
  safeTxHash: string;
  signal?: AbortSignal;
}): Promise<unknown | null> {
  const response = await fetch(safeClientTransactionUrl(input.chainId, input.safeAddress, input.safeTxHash), {
    signal: input.signal,
  });
  if (response.status === 404) return null;
  if (!response.ok) return null;
  return response.json();
}

export async function watchSafeProposal(input: {
  chainId: number;
  safeAddress: string;
  safeTxHash: string;
  onUpdate?: (snap: MultisigWatchSnapshot) => void;
  signal?: AbortSignal;
}): Promise<MultisigWatchSnapshot> {
  while (!input.signal?.aborted) {
    try {
      const body = await readSafeGatewayBody(input);
      if (body) {
        const snap = snapshotFromSafeGatewayBody(body);
        input.onUpdate?.(snap);
        if (snap.status !== MULTISIG_WATCH_STATUS.Pending) return snap;
      }
    } catch (error) {
      if (input.signal?.aborted) throw error;
    }
    await wait(SAFE_PROPOSAL_POLL_MS, input.signal);
  }
  throw new DOMException("Aborted", "AbortError");
}
