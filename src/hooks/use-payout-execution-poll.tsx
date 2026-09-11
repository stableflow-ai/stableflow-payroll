import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getPayrollExecution } from "@/api/payout";
import { queryKeys } from "@/api/query-keys";
import useToast, { type ToastHandle } from "@/hooks/use-toast";
import { organizationId } from "@/lib/auth-role";
import { useAuthStore } from "@/stores/auth";
import {
  onBatchPayoutCommitSuccess,
  type BatchPayoutCommitSuccess,
} from "@/stores/batch-payout-commit-queue";
import {
  EXECUTION_POLL_INTERVAL_MS,
  EXECUTION_PROGRESS_TOAST_MS,
} from "@/views/pay/execution-poll/config";
import {
  executionHistoryPath,
  executionItemToastKind,
  executionItemToastText,
  executionItemToastTitle,
  executionProgressMessage,
  newTerminalExecutionItems,
  payoutStatusQueryKeys,
} from "@/views/pay/execution-poll/utils";

function executionPollInterval(query: {
  state: { data?: { finished?: boolean } | null };
}): number | false {
  if (query.state.data?.finished) return false;
  return EXECUTION_POLL_INTERVAL_MS;
}

function progressText(
  processed: number,
  total: number,
  finished: boolean,
  onView: () => void,
): ReactNode {
  return (
    <span className="flex w-full items-center justify-between gap-2">
      <span>
        <span className="text-[#003bff]">{processed} / {total} </span>
        {executionProgressMessage(finished)}
      </span>
      <button type="button" className="shrink-0 text-[#003bff]" onClick={onView}>
        View
      </button>
    </span>
  );
}

interface ExecutionToastMeta {
  toast: ToastHandle;
  seen: Set<number>;
  dismissing: boolean;
}

export function usePayoutExecutionPoll() {
  const toastApi = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const orgId = organizationId(user);
  const [active, setActive] = useState<BatchPayoutCommitSuccess[]>([]);
  const activeRef = useRef(active);
  activeRef.current = active;
  const toastRef = useRef(toastApi);
  toastRef.current = toastApi;
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;
  const metaRef = useRef(new Map<number, ExecutionToastMeta>());

  useEffect(() => {
    function dismissOne(executionId: number, dismissToast: boolean) {
      const meta = metaRef.current.get(executionId);
      if (meta && dismissToast) {
        meta.dismissing = true;
        meta.toast.dismiss();
      }
      metaRef.current.delete(executionId);
      setActive((prev) => prev.filter((row) => row.executionId !== executionId));
    }

    function dismissAll(dismissToasts: boolean) {
      for (const [executionId, meta] of metaRef.current) {
        if (dismissToasts) {
          meta.dismissing = true;
          meta.toast.dismiss();
        }
        metaRef.current.delete(executionId);
      }
      setActive([]);
    }

    function handleView(executionId: number, type: string) {
      navigateRef.current(executionHistoryPath(type));
      dismissOne(executionId, true);
    }

    const unsubscribe = onBatchPayoutCommitSuccess((result) => {
      const current = activeRef.current;
      const sameForm = Boolean(result.formKey)
        && current.length > 0
        && current[0]?.formKey === result.formKey;
      if (!sameForm) dismissAll(true);
      const handle = toastRef.current.info({
        title: result.title || "Payment",
        duration: false,
        onClose: () => {
          const meta = metaRef.current.get(result.executionId);
          if (meta?.dismissing) return;
          dismissOne(result.executionId, false);
        },
        text: progressText(0, 0, false, () => handleView(result.executionId, result.type)),
      });
      metaRef.current.set(result.executionId, {
        toast: handle,
        seen: new Set(),
        dismissing: false,
      });
      setActive((prev) => {
        if (sameForm && prev.some((row) => row.executionId === result.executionId)) {
          return prev;
        }
        return sameForm ? [...prev, result] : [result];
      });
    });

    return () => {
      unsubscribe();
      dismissAll(true);
    };
  }, []);

  const queries = useQueries({
    queries: active.map((row) => ({
      queryKey: queryKeys.payout.execution(row.executionId),
      queryFn: () => getPayrollExecution(row.executionId, orgId!),
      enabled: orgId != null,
      staleTime: 0,
      refetchInterval: executionPollInterval,
      retry: 0,
    })),
  });

  useEffect(() => {
    const finishedIds: number[] = [];
    for (let index = 0; index < active.length; index += 1) {
      const row = active[index];
      const data = queries[index]?.data;
      if (!row || !data || data.executionId !== row.executionId) continue;
      const meta = metaRef.current.get(row.executionId);
      if (!meta) continue;

      const type = data.type || row.type;
      const title = data.title || row.title || "Payment";
      const nextItems = newTerminalExecutionItems(meta.seen, data.list);
      for (const item of nextItems) {
        meta.seen.add(item.id);
        const kind = executionItemToastKind(item.status);
        const text = executionItemToastText(item.status);
        if (!kind || !text) continue;
        const toastTitle = executionItemToastTitle(item);
        if (kind === "success") {
          toastRef.current.success({ title: toastTitle, text });
        } else {
          toastRef.current.fail({ title: toastTitle, text });
        }
      }

      meta.toast.update({
        title,
        text: progressText(data.processed, data.total, data.finished, () => {
          navigateRef.current(executionHistoryPath(type));
          meta.dismissing = true;
          meta.toast.dismiss();
          metaRef.current.delete(row.executionId);
          setActive((prev) => prev.filter((item) => item.executionId !== row.executionId));
        }),
        ...(data.finished ? { duration: EXECUTION_PROGRESS_TOAST_MS } : {}),
      });

      if (data.finished) {
        for (const queryKey of payoutStatusQueryKeys(type)) {
          void queryClientRef.current.invalidateQueries({ queryKey });
        }
        finishedIds.push(row.executionId);
      }
    }
    if (!finishedIds.length) return;
    setActive((prev) => prev.filter((row) => !finishedIds.includes(row.executionId)));
  }, [active, queries]);
}
