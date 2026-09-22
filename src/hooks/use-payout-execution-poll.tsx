import { useEffect, useRef, type ReactNode } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getPayrollExecution } from "@/api/payout";
import { queryKeys } from "@/api/query-keys";
import useToast, { type ToastHandle } from "@/hooks/use-toast";
import { organizationId } from "@/lib/auth-role";
import { useAuthStore } from "@/stores/auth";
import { onBatchPayoutCommitSuccess } from "@/stores/batch-payout-commit-queue";
import { useMultisigWatchStore } from "@/stores/multisig-watch-sessions";
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

interface ItemToast {
  kind: "success" | "fail";
  title: string;
  text: string;
}

export function usePayoutExecutionPoll() {
  const toastApi = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const orgId = organizationId(user);
  const active = useMultisigWatchStore((state) => state.executions);
  const toastRef = useRef(toastApi);
  toastRef.current = toastApi;
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;
  const metaRef = useRef(new Map<number, ExecutionToastMeta>());
  const itemToastRef = useRef<ToastHandle | null>(null);

  useEffect(() => {
    function dismissItemToast() {
      itemToastRef.current?.dismiss();
      itemToastRef.current = null;
    }

    const unsubscribe = onBatchPayoutCommitSuccess((result) => {
      const current = useMultisigWatchStore.getState().executions;
      const sameForm = Boolean(result.formKey)
        && current.length > 0
        && current[0]?.formKey === result.formKey;
      if (!sameForm) {
        for (const [executionId, meta] of metaRef.current) {
          meta.dismissing = true;
          meta.toast.dismiss();
          metaRef.current.delete(executionId);
        }
        dismissItemToast();
      }
      useMultisigWatchStore.getState().upsertExecution(result);
    });

    return () => {
      unsubscribe();
      for (const meta of metaRef.current.values()) {
        meta.dismissing = true;
        meta.toast.dismiss();
      }
      metaRef.current.clear();
      dismissItemToast();
    };
  }, []);

  useEffect(() => {
    const activeIds = new Set(active.map((row) => row.executionId));
    for (const [executionId, meta] of metaRef.current) {
      if (activeIds.has(executionId) || meta.dismissing) continue;
      meta.toast.dismiss();
      metaRef.current.delete(executionId);
    }

    function handleView(executionId: number, type: string) {
      navigateRef.current(executionHistoryPath(type));
      const meta = metaRef.current.get(executionId);
      if (meta) {
        meta.dismissing = true;
        meta.toast.dismiss();
        metaRef.current.delete(executionId);
      }
      useMultisigWatchStore.getState().removeExecution(executionId);
    }

    for (const row of active) {
      if (metaRef.current.has(row.executionId)) continue;
      const handle = toastRef.current.info({
        title: row.title || "Payment",
        duration: false,
        onClose: () => {
          const meta = metaRef.current.get(row.executionId);
          if (meta?.dismissing) return;
          metaRef.current.delete(row.executionId);
          useMultisigWatchStore.getState().removeExecution(row.executionId);
        },
        text: progressText(0, 0, false, () => handleView(row.executionId, row.type)),
      });
      metaRef.current.set(row.executionId, {
        toast: handle,
        seen: new Set(),
        dismissing: false,
      });
    }
  }, [active]);

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
    let latestItem: ItemToast | null = null;
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
        latestItem = { kind, title: executionItemToastTitle(item), text };
      }

      meta.toast.update({
        title,
        text: progressText(data.processed, data.total, data.finished, () => {
          navigateRef.current(executionHistoryPath(type));
          meta.dismissing = true;
          meta.toast.dismiss();
          metaRef.current.delete(row.executionId);
          useMultisigWatchStore.getState().removeExecution(row.executionId);
        }),
        ...(data.finished ? { duration: EXECUTION_PROGRESS_TOAST_MS } : {}),
      });

      if (data.finished) {
        meta.dismissing = true;
        for (const queryKey of payoutStatusQueryKeys(type)) {
          void queryClientRef.current.invalidateQueries({ queryKey });
        }
        finishedIds.push(row.executionId);
      }
    }
    if (latestItem) replaceItemToast(toastRef.current, itemToastRef, latestItem);
    if (!finishedIds.length) return;
    for (const executionId of finishedIds) {
      useMultisigWatchStore.getState().removeExecution(executionId);
    }
  }, [active, queries]);
}

function replaceItemToast(
  toastApi: ReturnType<typeof useToast>,
  itemToastRef: { current: ToastHandle | null },
  item: ItemToast,
) {
  itemToastRef.current?.dismiss();
  const shown: { handle: ToastHandle | null } = { handle: null };
  const params = {
    title: item.title,
    text: item.text,
    onClose: () => {
      if (itemToastRef.current === shown.handle) itemToastRef.current = null;
    },
  };
  shown.handle = item.kind === "success" ? toastApi.success(params) : toastApi.fail(params);
  itemToastRef.current = shown.handle;
}
