import { useEffect, useRef } from "react";
import { batchSubmit } from "@/api/payout";
import {
  listenToastText,
  showMultisigListenToast,
} from "@/components/multisig/multisig-proposal-toast";
import useToast, { type ToastHandle } from "@/hooks/use-toast";
import { notifyBatchPayoutCommitSuccess } from "@/stores/batch-payout-commit-queue";
import {
  useMultisigWatchStore,
  type MultisigWatchSession,
} from "@/stores/multisig-watch-sessions";
import {
  MULTISIG_FAILED_MESSAGE,
  MULTISIG_QUOTE_EXPIRED_MESSAGE,
  MULTISIG_SUBMIT_FAILED_MESSAGE,
  MULTISIG_WATCH_STATUS,
  abortOnQuoteDeadline,
  deserializePendingMultisig,
  txHashForSubmit,
  watchMultisigProposal,
} from "@/wallet/multisig";

/**
 * Root host: resume sessionStorage watch sessions and drive listen toasts.
 * Closing a listen toast does not abort the watcher.
 */
export function useMultisigWatchHost() {
  const toast = useToast();
  const watches = useMultisigWatchStore((state) => state.watches);
  const runningRef = useRef(new Map<string, AbortController>());
  const listenRef = useRef(new Map<string, ToastHandle>());
  const toastRef = useRef(toast);
  toastRef.current = toast;

  useEffect(() => {
    const running = runningRef.current;
    const listenToasts = listenRef.current;
    const ids = new Set(watches.map((row) => row.id));

    for (const [id, controller] of running) {
      if (ids.has(id)) continue;
      controller.abort();
      running.delete(id);
      listenToasts.get(id)?.dismiss();
      listenToasts.delete(id);
    }

    for (const session of watches) {
      if (running.has(session.id)) continue;
      const controller = new AbortController();
      running.set(session.id, controller);
      void runWatch(session, controller, toastRef.current, listenToasts);
    }
  }, [watches]);

  useEffect(() => {
    const running = runningRef.current;
    const listenToasts = listenRef.current;
    return () => {
      for (const controller of running.values()) controller.abort();
      running.clear();
      for (const handle of listenToasts.values()) handle.dismiss();
      listenToasts.clear();
    };
  }, []);
}

function dismissListenToast(sessionId: string, listenToasts: Map<string, ToastHandle>) {
  listenToasts.get(sessionId)?.dismiss();
  listenToasts.delete(sessionId);
}

function finishExpiredWatch(
  sessionId: string,
  toast: ReturnType<typeof useToast>,
  listenToasts: Map<string, ToastHandle>,
) {
  dismissListenToast(sessionId, listenToasts);
  toast.fail({ title: MULTISIG_QUOTE_EXPIRED_MESSAGE });
  useMultisigWatchStore.getState().removeWatch(sessionId);
}

async function runWatch(
  session: MultisigWatchSession,
  controller: AbortController,
  toast: ReturnType<typeof useToast>,
  listenToasts: Map<string, ToastHandle>,
) {
  const proposal = deserializePendingMultisig(session.proposal);
  let expired = false;
  const stopExpire = abortOnQuoteDeadline(session.deadline, () => {
    expired = true;
    if (!controller.signal.aborted) controller.abort();
  });
  try {
    if (expired) {
      finishExpiredWatch(session.id, toast, listenToasts);
      return;
    }
    const result = await watchMultisigProposal(proposal, (snap) => {
      if (controller.signal.aborted) return;
      if (snap.status !== MULTISIG_WATCH_STATUS.Pending) return;
      const live = useMultisigWatchStore.getState().watches.find((row) => row.id === session.id);
      if (live?.listenDismissed) return;
      const existing = listenToasts.get(session.id);
      const text = listenToastText(snap.signed, snap.required);
      if (!existing) {
        const handle = showMultisigListenToast(toast, {
          signed: snap.signed,
          required: snap.required,
          onClose: () => {
            listenToasts.delete(session.id);
            useMultisigWatchStore.getState().dismissListen(session.id);
          },
        });
        listenToasts.set(session.id, handle);
        return;
      }
      existing.update({ text });
    }, controller.signal);

    dismissListenToast(session.id, listenToasts);
    if (result.status === MULTISIG_WATCH_STATUS.Success) {
      try {
        const submitted = await batchSubmit({
          quote_id: session.quoteId,
          quote_batch_id: session.quoteBatchId,
          tx_hash: txHashForSubmit(result.txHash),
        });
        notifyBatchPayoutCommitSuccess({
          executionId: submitted.executionId,
          title: session.title,
          type: session.type,
          formKey: session.formKey,
        });
      } catch {
        toast.fail({ title: MULTISIG_SUBMIT_FAILED_MESSAGE });
      }
      useMultisigWatchStore.getState().removeWatch(session.id);
      return;
    }
    if (expired) {
      finishExpiredWatch(session.id, toast, listenToasts);
      return;
    }
    if (controller.signal.aborted) return;
    toast.fail({ title: MULTISIG_FAILED_MESSAGE });
  } catch (error) {
    if (expired) {
      finishExpiredWatch(session.id, toast, listenToasts);
      return;
    }
    if (controller.signal.aborted) return;
    if (error instanceof DOMException && error.name === "AbortError") return;
  } finally {
    stopExpire();
    if (!controller.signal.aborted) {
      useMultisigWatchStore.getState().removeWatch(session.id);
    }
  }
}
