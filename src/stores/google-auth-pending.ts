import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { GOOGLE_AUTH_PENDING_STORAGE_KEY } from "@/lib/google/config";

export interface GoogleAuthPending {
  idToken: string | null;
  name: string;
  email: string;
  orgId: string;
  returnTo: string | null;
}

interface GoogleAuthPendingState extends GoogleAuthPending {
  setPending: (pending: Omit<GoogleAuthPending, "idToken"> & { idToken: string }) => void;
  clear: () => void;
}

const EMPTY_PENDING: GoogleAuthPending = {
  idToken: null,
  name: "",
  email: "",
  orgId: "",
  returnTo: null,
};

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

export const useGoogleAuthPendingStore = create<GoogleAuthPendingState>()(
  persist(
    (set) => ({
      ...EMPTY_PENDING,
      setPending: (pending) => {
        set({
          idToken: pending.idToken,
          name: pending.name,
          email: pending.email,
          orgId: pending.orgId,
          returnTo: pending.returnTo,
        });
      },
      clear: () => {
        set(EMPTY_PENDING);
      },
    }),
    {
      name: GOOGLE_AUTH_PENDING_STORAGE_KEY,
      storage: createJSONStorage(() => sessionStateStorage),
      partialize: (state) => ({
        idToken: state.idToken,
        name: state.name,
        email: state.email,
        orgId: state.orgId,
        returnTo: state.returnTo,
      }),
    },
  ),
);

export function hasGoogleAuthPending(
  session: Pick<GoogleAuthPending, "idToken"> = useGoogleAuthPendingStore.getState(),
): boolean {
  return Boolean(session.idToken);
}
