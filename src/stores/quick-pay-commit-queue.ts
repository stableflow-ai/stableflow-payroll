import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const STORAGE_KEY = "stableflow-pay:quick-pay-commit-queue:v1";
const BASE_RETRY_MS = 5_000;

export interface QuickPayCommitItem {
  id: string;
  orderId: string;
  txHash: string;
  createdAt: number;
}

interface QuickPayCommitQueueState {
  queue: QuickPayCommitItem[];
  enqueue: (item: QuickPayCommitItem) => void;
  remove: (id: string) => void;
}

interface TaskMeta {
  inFlight: boolean;
  timer?: ReturnType<typeof setTimeout>;
}

const taskMetaMap = new Map<string, TaskMeta>();

type CommitSuccessListener = () => void;
const successListeners = new Set<CommitSuccessListener>();

export function onQuickPayCommitSuccess(listener: CommitSuccessListener): () => void {
  successListeners.add(listener);
  return () => {
    successListeners.delete(listener);
  };
}

function notifySuccessListeners() {
  for (const listener of successListeners) {
    try {
      listener();
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

function scheduleRetry(id: string, item: QuickPayCommitItem, retryCount: number) {
  const delay = getRetryDelay(retryCount);
  const meta = taskMetaMap.get(id) ?? { inFlight: false };
  if (meta.timer) clearTimeout(meta.timer);
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

async function processCommit(id: string, item: QuickPayCommitItem, retryCount = 0) {
  const stillQueued = useQuickPayCommitQueueStore.getState().queue.some((row) => row.id === id);
  if (!stillQueued) {
    clearTaskMeta(id);
    return;
  }

  const meta = taskMetaMap.get(id);
  if (meta?.inFlight) return;

  taskMetaMap.set(id, { ...meta, inFlight: true });

  try {
    const { singleSubmit } = await import("@/api/payout");
    await singleSubmit({ orderId: item.orderId, txHash: item.txHash });
    useQuickPayCommitQueueStore.getState().remove(id);
    clearTaskMeta(id);
    notifySuccessListeners();
  } catch {
    taskMetaMap.set(id, {
      ...(taskMetaMap.get(id) ?? {}),
      inFlight: false,
    });
    scheduleRetry(id, item, retryCount);
  }
}

export const useQuickPayCommitQueueStore = create(
  persist<QuickPayCommitQueueState>(
    (set) => ({
      queue: [],
      enqueue: (item) => {
        set((state) => {
          if (state.queue.some((row) => row.id === item.id || row.txHash === item.txHash || row.orderId === item.orderId)) {
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
      partialize: (state) => ({ queue: state.queue }) as QuickPayCommitQueueState,
    },
  ),
);

export function enqueueQuickPayCommit(input: {
  orderId: string;
  txHash: string;
}): string {
  const id = crypto.randomUUID();
  const item: QuickPayCommitItem = {
    id,
    orderId: input.orderId,
    txHash: input.txHash,
    createdAt: Date.now(),
  };
  useQuickPayCommitQueueStore.getState().enqueue(item);
  void processCommit(item.id, item, 0);
  return id;
}

export function processAllPendingQuickPayCommits() {
  const { queue } = useQuickPayCommitQueueStore.getState();
  for (const item of queue) {
    const meta = taskMetaMap.get(item.id);
    if (meta?.inFlight || meta?.timer) continue;
    void processCommit(item.id, item, 0);
  }
}
