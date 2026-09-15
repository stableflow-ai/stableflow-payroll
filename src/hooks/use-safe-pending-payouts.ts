/**
 * Resolve Safe proposals that are still waiting for signatures.
 *
 * The probe is chain-only, so it keeps working after the wallet disconnects or the
 * user reloads — the records are persisted and the scan floor moves forward as
 * blocks are covered. It does need the tab open; see the TODO in
 * `src/stores/safe-pending-payout.ts`.
 */

import { useEffect, useRef } from "react";
import useToast from "@/hooks/use-toast";
import { enqueueBatchPayoutCommit } from "@/stores/batch-payout-commit-queue";
import {
  useSafePendingPayoutStore,
  type SafePendingPayout,
} from "@/stores/safe-pending-payout";
import {
  decidePendingAction,
  SAFE_PENDING_MAX_BACKOFF_MS,
  SAFE_PENDING_POLL_MS,
  SAFE_PROPOSAL_FAILED_MESSAGE,
  SAFE_PROPOSAL_REPLACED_MESSAGE,
  SAFE_QUOTE_EXPIRED_MESSAGE,
  resolveSafeSubmission,
} from "@/wallet/evm/safe";
import type { Address, Hex } from "viem";

export function useSafePendingPayouts() {
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  /** Records whose probe failed, held off until this timestamp. */
  const backoffRef = useRef(new Map<string, { until: number; failures: number }>());
  const inFlightRef = useRef(false);

  useEffect(() => {
    let stopped = false;

    async function probeOne(item: SafePendingPayout) {
      const store = useSafePendingPayoutStore.getState();
      const probe = await resolveSafeSubmission({
        chainId: item.chainId,
        safeAddress: item.safeAddress as Address,
        hash: item.safeTxHash as Hex,
        fromBlock: BigInt(item.fromBlock),
        safeNonce: item.safeNonce,
      });

      if (probe.state === "unknown") {
        const previous = backoffRef.current.get(item.id)?.failures ?? 0;
        const failures = previous + 1;
        const delay = Math.min(
          SAFE_PENDING_POLL_MS * 2 ** failures,
          SAFE_PENDING_MAX_BACKOFF_MS,
        );
        backoffRef.current.set(item.id, { until: Date.now() + delay, failures });
        return;
      }
      backoffRef.current.delete(item.id);

      // Covered blocks never need re-scanning, and a long-pending proposal would
      // otherwise re-read the same range on every cycle.
      if (probe.scannedToBlock != null) {
        const next = (probe.scannedToBlock + 1n).toString();
        if (next !== item.fromBlock) store.setScanFloor(item.id, next);
      }

      const action = decidePendingAction(item, probe, Date.now());
      if (action.type === "commit") {
        enqueueBatchPayoutCommit({
          quoteId: item.quoteId,
          quoteBatchId: item.quoteBatchId,
          txHash: action.txHash,
          title: item.title,
          type: item.type,
          formKey: item.formKey,
        });
        store.remove(item.id);
        toastRef.current.success({ title: `${item.title} sent` });
        return;
      }
      if (action.type === "drop") {
        store.remove(item.id);
        backoffRef.current.delete(item.id);
        toastRef.current.fail({
          title: action.reason === "cancelled"
            ? SAFE_PROPOSAL_REPLACED_MESSAGE
            : SAFE_PROPOSAL_FAILED_MESSAGE,
        });
        return;
      }
      if (action.type === "warn-expired") {
        store.markExpiredWarned(item.id);
        toastRef.current.info({ title: SAFE_QUOTE_EXPIRED_MESSAGE });
      }
    }

    async function runCycle() {
      if (stopped || inFlightRef.current) return;
      const { items } = useSafePendingPayoutStore.getState();
      if (items.length === 0) return;
      inFlightRef.current = true;
      try {
        const now = Date.now();
        const due = items.filter((item) => (backoffRef.current.get(item.id)?.until ?? 0) <= now);
        await Promise.all(due.map((item) => probeOne(item).catch(() => {})));
      } finally {
        inFlightRef.current = false;
      }
    }

    void runCycle();
    const timer = setInterval(() => void runCycle(), SAFE_PENDING_POLL_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, []);
}
