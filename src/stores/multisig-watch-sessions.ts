import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { MULTISIG_WATCH_STORAGE_KEY } from "@/wallet/multisig/config";
import type { StoredPendingMultisig } from "@/wallet/multisig/serialize";

const sessionStateStorage: StateStorage = {
  getItem: (name) => {
    try {
      return globalThis.sessionStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      globalThis.sessionStorage.setItem(name, value);
    } catch {
      // Ignore quota / private-mode failures; memory still holds the session.
    }
  },
  removeItem: (name) => {
    try {
      globalThis.sessionStorage.removeItem(name);
    } catch {
      // Ignore quota / private-mode failures.
    }
  },
};

export interface MultisigWatchSession {
  id: string;
  proposal: StoredPendingMultisig;
  quoteId: string;
  quoteBatchId: string;
  title: string;
  type: string;
  formKey: string;
  listenDismissed: boolean;
}

export interface StoredExecutionSession {
  executionId: number;
  title: string;
  type: string;
  formKey: string;
}

interface MultisigWatchState {
  watches: MultisigWatchSession[];
  executions: StoredExecutionSession[];
  upsertWatch: (session: MultisigWatchSession) => void;
  dismissListen: (id: string) => void;
  removeWatch: (id: string) => void;
  upsertExecution: (row: StoredExecutionSession) => void;
  removeExecution: (executionId: number) => void;
}

export const useMultisigWatchStore = create<MultisigWatchState>()(
  persist(
    (set) => ({
      watches: [],
      executions: [],
      upsertWatch: (session) => {
        set((state) => {
          const without = state.watches.filter((row) => row.id !== session.id);
          return { watches: [...without, session] };
        });
      },
      dismissListen: (id) => {
        set((state) => ({
          watches: state.watches.map((row) => (
            row.id === id ? { ...row, listenDismissed: true } : row
          )),
        }));
      },
      removeWatch: (id) => {
        set((state) => ({
          watches: state.watches.filter((row) => row.id !== id),
        }));
      },
      upsertExecution: (row) => {
        set((state) => {
          const sameForm = Boolean(row.formKey)
            && state.executions.length > 0
            && state.executions[0]?.formKey === row.formKey;
          if (!sameForm) return { executions: [row] };
          if (state.executions.some((item) => item.executionId === row.executionId)) {
            return state;
          }
          return { executions: [...state.executions, row] };
        });
      },
      removeExecution: (executionId) => {
        set((state) => ({
          executions: state.executions.filter((row) => row.executionId !== executionId),
        }));
      },
    }),
    {
      name: MULTISIG_WATCH_STORAGE_KEY,
      storage: createJSONStorage(() => sessionStateStorage),
      partialize: (state) => ({
        watches: state.watches,
        executions: state.executions,
      }),
    },
  ),
);
