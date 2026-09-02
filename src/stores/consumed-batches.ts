/**
 * A batch quote may only be paid once. 1Click does not refund a second
 * transfer to the same deposit addresses, so a consumed `batchId` must never
 * be broadcast against again — the payer has to take a fresh batch instead.
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const STORAGE_KEY = "stableflow-pay:consumed-batches:v1";
const MAX_ENTRIES = 50;
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface ConsumedBatch {
  batchId: string;
  consumedAt: number;
}

interface ConsumedBatchesState {
  items: ConsumedBatch[];
  markConsumed: (batchId: string) => void;
}

function prune(items: ConsumedBatch[], now: number): ConsumedBatch[] {
  return items
    .filter((item) => now - item.consumedAt < TTL_MS)
    .slice(-MAX_ENTRIES);
}

export const useConsumedBatchesStore = create(
  persist<ConsumedBatchesState>(
    (set) => ({
      items: [],
      markConsumed: (batchId) => {
        const id = batchId.trim();
        if (!id) return;
        set((state) => {
          if (state.items.some((item) => item.batchId === id)) return state;
          const now = Date.now();
          return { items: prune([...state.items, { batchId: id, consumedAt: now }], now) };
        });
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }) as ConsumedBatchesState,
    },
  ),
);

export function markBatchConsumed(batchId: string) {
  useConsumedBatchesStore.getState().markConsumed(batchId);
}

export function isBatchConsumed(batchId: string): boolean {
  const id = batchId.trim();
  if (!id) return false;
  const now = Date.now();
  return useConsumedBatchesStore
    .getState()
    .items.some((item) => item.batchId === id && now - item.consumedAt < TTL_MS);
}
