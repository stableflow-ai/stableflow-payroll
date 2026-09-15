/**
 * What to do with a proposal that is still waiting for signatures.
 *
 * Kept as a pure function next to the resolver so every pending store — batch
 * payouts, single swaps — reaches the same verdict from the same probe.
 */

import type { SafeSubmissionProbe } from "./types";

export type SafePendingAction =
  | { type: "commit"; txHash: string }
  | { type: "drop"; reason: "cancelled" | "failed" }
  | { type: "warn-expired" }
  | { type: "keep-waiting" };

/**
 * `unknown` maps to `keep-waiting`: the probe could not complete, which is not
 * evidence of anything.
 *
 * `warn-expired` is only a UI signal and fires once. The record deliberately stays
 * pending afterwards — another owner may still execute it, and that transaction
 * hash still has to reach the backend even though the quote is gone.
 */
export function decidePendingAction(
  item: { deadline: string; expiredWarnedAt?: number },
  probe: SafeSubmissionProbe,
  now: number,
): SafePendingAction {
  if (probe.state === "executed" && probe.txHash) return { type: "commit", txHash: probe.txHash };
  if (probe.state === "failed") return { type: "drop", reason: "failed" };
  if (probe.state === "cancelled") return { type: "drop", reason: "cancelled" };

  const deadlineMs = Date.parse(item.deadline);
  const expired = Number.isFinite(deadlineMs) && deadlineMs <= now;
  if (expired && !item.expiredWarnedAt) return { type: "warn-expired" };

  return { type: "keep-waiting" };
}
