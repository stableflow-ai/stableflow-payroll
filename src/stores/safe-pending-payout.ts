/**
 * Batch payouts proposed to a Safe and still waiting for signatures.
 *
 * A Safe proposal has no transaction hash until the owners execute it, which can
 * take hours, so the payout cannot be handed to `batch-payout-commit-queue` yet.
 * Records live here until `use-safe-pending-payouts` resolves a real hash, then
 * move to that queue and follow the normal submit path.
 *
 * TODO: this depends on a browser polling the chain. Once the backend can register
 * a `safe_tx_hash` and watch for execution server-side (see the backend
 * requirements doc), the payout should be handed over at proposal time and this
 * store reduced to a display cache.
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const STORAGE_KEY = "stableflow-pay:safe-pending-payout:v1";

export interface SafePendingPayout {
  id: string;
  safeTxHash: string;
  safeAddress: string;
  chainId: number;
  /** Signatures the Safe requires, for the waiting copy. */
  threshold: number;
  /** Safe nonce at proposal time; a higher nonce on-chain means replacement. */
  safeNonce: number;
  /** Log scan floor, advanced as the poller covers blocks. Serialized bigint. */
  fromBlock: string;
  /** Quote deadline as the backend returned it. */
  deadline: string;
  createdAt: number;
  /** Set once the expiry warning has been shown, so it is not repeated. */
  expiredWarnedAt?: number;
  // Everything `enqueueBatchPayoutCommit` needs once a real hash exists.
  quoteId: string;
  quoteBatchId: string;
  title: string;
  type: string;
  formKey: string;
}

interface SafePendingPayoutState {
  items: SafePendingPayout[];
  enqueue: (item: SafePendingPayout) => void;
  remove: (id: string) => void;
  setScanFloor: (id: string, fromBlock: string) => void;
  markExpiredWarned: (id: string) => void;
}

export const useSafePendingPayoutStore = create(
  persist<SafePendingPayoutState>(
    (set) => ({
      items: [],
      enqueue: (item) => {
        set((state) => {
          const duplicate = state.items.some(
            (row) =>
              row.id === item.id
              || (row.safeTxHash === item.safeTxHash && row.quoteBatchId === item.quoteBatchId),
          );
          if (duplicate) return state;
          return { items: [...state.items, item] };
        });
      },
      remove: (id) => {
        set((state) => ({ items: state.items.filter((row) => row.id !== id) }));
      },
      setScanFloor: (id, fromBlock) => {
        set((state) => ({
          items: state.items.map((row) => (row.id === id ? { ...row, fromBlock } : row)),
        }));
      },
      markExpiredWarned: (id) => {
        set((state) => ({
          items: state.items.map((row) =>
            row.id === id ? { ...row, expiredWarnedAt: Date.now() } : row,
          ),
        }));
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }) as SafePendingPayoutState,
    },
  ),
);

export function enqueueSafePendingPayout(input: Omit<SafePendingPayout, "id" | "createdAt">): string {
  const id = crypto.randomUUID();
  useSafePendingPayoutStore.getState().enqueue({ ...input, id, createdAt: Date.now() });
  return id;
}

