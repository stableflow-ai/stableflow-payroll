import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

export function usePayoutExecutionPoll() {
  const toastApi = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const orgId = organizationId(user);
  const [active, setActive] = useState<BatchPayoutCommitSuccess | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  const toastRef = useRef(toastApi);
  toastRef.current = toastApi;
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;
  const seenRef = useRef(new Set<number>());
  const progressRef = useRef<ToastHandle | null>(null);
  const dismissingRef = useRef(false);

  useEffect(() => {
    function stop(dismissToast: boolean) {
      setActive(null);
      seenRef.current = new Set();
      if (dismissToast) {
        dismissingRef.current = true;
        progressRef.current?.dismiss();
        dismissingRef.current = false;
      }
      progressRef.current = null;
    }

    function handleView(type: string) {
      navigateRef.current(executionHistoryPath(type));
      stop(true);
    }

    const unsubscribe = onBatchPayoutCommitSuccess((result) => {
      stop(true);
      seenRef.current = new Set();
      setActive(result);
      progressRef.current = toastRef.current.info({
        title: result.title || "Payment",
        duration: false,
        onClose: () => {
          if (dismissingRef.current) return;
          if (activeRef.current?.executionId !== result.executionId) return;
          stop(false);
        },
        text: progressText(0, 0, false, () => handleView(result.type)),
      });
    });

    return () => {
      unsubscribe();
      stop(true);
    };
  }, []);

  const query = useQuery({
    queryKey: queryKeys.payout.execution(active?.executionId ?? 0),
    queryFn: () => getPayrollExecution(active!.executionId, orgId!),
    enabled: Boolean(active) && orgId != null,
    staleTime: 0,
    refetchInterval: (current) => {
      if (current.state.data?.finished) return false;
      return EXECUTION_POLL_INTERVAL_MS;
    },
    retry: 0,
  });

  useEffect(() => {
    const data = query.data;
    if (!active || !data || data.executionId !== active.executionId) return;

    const type = data.type || active.type;
    const title = data.title || active.title || "Payment";
    const nextItems = newTerminalExecutionItems(seenRef.current, data.list);
    for (const item of nextItems) {
      seenRef.current.add(item.id);
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

    progressRef.current?.update({
      title,
      text: progressText(data.processed, data.total, data.finished, () => {
        navigateRef.current(executionHistoryPath(type));
        setActive(null);
        seenRef.current = new Set();
        dismissingRef.current = true;
        progressRef.current?.dismiss();
        dismissingRef.current = false;
        progressRef.current = null;
      }),
      ...(data.finished ? { duration: EXECUTION_PROGRESS_TOAST_MS } : {}),
    });

    if (data.finished) {
      for (const queryKey of payoutStatusQueryKeys(type)) {
        void queryClientRef.current.invalidateQueries({ queryKey });
      }
      setActive(null);
    }
  }, [active, query.data]);
}
