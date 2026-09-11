import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const STORAGE_KEY = "stableflow-pay:batch-payout-commit-queue:v3";
const BASE_RETRY_MS = 5_000;

export interface BatchPayoutCommitItem {
  id: string;
  quoteId: string;
  quoteBatchId: string;
  txHash: string;
  title: string;
  type: string;
  formKey: string;
  createdAt: number;
}

export interface BatchPayoutCommitSuccess {
  executionId: number;
  title: string;
  type: string;
  formKey: string;
}

interface BatchPayoutCommitQueueState {
  queue: BatchPayoutCommitItem[];
  enqueue: (item: BatchPayoutCommitItem) => void;
  remove: (id: string) => void;
}

interface TaskMeta {
  inFlight: boolean;
  timer?: ReturnType<typeof setTimeout>;
}

const taskMetaMap = new Map<string, TaskMeta>();

type CommitSuccessListener = (result: BatchPayoutCommitSuccess) => void;
const successListeners = new Set<CommitSuccessListener>();

export function onBatchPayoutCommitSuccess(listener: CommitSuccessListener): () => void {
  successListeners.add(listener);
  return () => {
    successListeners.delete(listener);
  };
}

function notifySuccessListeners(result: BatchPayoutCommitSuccess) {
  for (const listener of successListeners) {
    try {
      listener(result);
    } catch {
      // ignore listener errors
    }
  }
}

function getRetryDelay(retryCount: number): number {
  return BASE_RETRY_MS * 2 ** retryCount;
}

function clearTaskMeta(id: string) {
  const meta = taskMetaMap.get(id);
  if (meta?.timer) clearTimeout(meta.timer);
  taskMetaMap.delete(id);
}

function scheduleRetry(id: string, item: BatchPayoutCommitItem, retryCount: number) {
  const delay = getRetryDelay(retryCount);
  const meta = taskMetaMap.get(id) ?? { inFlight: false };
  if (meta?.timer) clearTimeout(meta.timer);
  meta.timer = setTimeout(() => {
    const current = taskMetaMap.get(id);
    if (current) {
      current.timer = undefined;
      taskMetaMap.set(id, current);
    }
    void processCommit(id, item, retryCount + 1);
  }, delay);
  taskMetaMap.set(id, meta);
}

async function processCommit(id: string, item: BatchPayoutCommitItem, retryCount = 0) {
  const stillQueued = useBatchPayoutCommitQueueStore.getState().queue.some((row) => row.id === id);
  if (!stillQueued) {
    clearTaskMeta(id);
    return;
  }

  const meta = taskMetaMap.get(id);
  if (meta?.inFlight) return;

  taskMetaMap.set(id, { ...meta, inFlight: true });

  try {
    const { batchSubmit } = await import("@/api/payout");
    const submitted = await batchSubmit({
      quote_id: item.quoteId,
      quote_batch_id: item.quoteBatchId,
      tx_hash: item.txHash,
    });
    useBatchPayoutCommitQueueStore.getState().remove(id);
    clearTaskMeta(id);
    notifySuccessListeners({
      executionId: submitted.executionId,
      title: item.title,
      type: item.type,
      formKey: item.formKey,
    });
  } catch {
    taskMetaMap.set(id, {
      ...(taskMetaMap.get(id) ?? {}),
      inFlight: false,
    });
    scheduleRetry(id, item, retryCount);
  }
}

export const useBatchPayoutCommitQueueStore = create(
  persist<BatchPayoutCommitQueueState>(
    (set) => ({
      queue: [],
      enqueue: (item) => {
        set((state) => {
          if (
            state.queue.some(
              (row) =>
                row.id === item.id
                || row.txHash === item.txHash
                || (item.quoteBatchId && row.quoteBatchId === item.quoteBatchId),
            )
          ) {
            return state;
          }
          return { queue: [...state.queue, item] };
        });
      },
      remove: (id) => {
        set((state) => ({
          queue: state.queue.filter((row) => row.id !== id),
        }));
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ queue: state.queue }) as BatchPayoutCommitQueueState,
    },
  ),
);

export function enqueueBatchPayoutCommit(input: {
  quoteId: string;
  quoteBatchId: string;
  txHash: string;
  title: string;
  type: string;
  formKey: string;
}): string {
  const id = crypto.randomUUID();
  const item: BatchPayoutCommitItem = {
    id,
    quoteId: input.quoteId,
    quoteBatchId: input.quoteBatchId,
    txHash: input.txHash,
    title: input.title,
    type: input.type,
    formKey: input.formKey,
    createdAt: Date.now(),
  };
  useBatchPayoutCommitQueueStore.getState().enqueue(item);
  void processCommit(item.id, item, 0);
  return id;
}

export function processAllPendingBatchPayoutCommits() {
  const { queue } = useBatchPayoutCommitQueueStore.getState();
  for (const item of queue) {
    const meta = taskMetaMap.get(item.id);
    if (meta?.inFlight || meta?.timer) continue;
    void processCommit(item.id, item, 0);
  }
}
