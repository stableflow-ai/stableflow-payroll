import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import {
  GOOGLE_DRIVE_TOKEN_STORAGE_KEY,
  TOKEN_EXPIRY_SKEW_MS,
} from "@/lib/google/config";

/**
 * Google Drive / Sheets GIS access token. Not the product JWT in `useAuthStore`.
 */
export interface GoogleDriveSession {
  accessToken: string | null;
  expiresAt: number;
  /** After sign-out, the next GIS request must show the account picker. */
  requireAccountPicker: boolean;
}

interface GoogleDriveSessionState extends GoogleDriveSession {
  upsert: (session: Pick<GoogleDriveSession, "accessToken" | "expiresAt">) => void;
  expire: () => void;
  clear: () => void;
}

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

export function isUsableGoogleDriveSession(
  session: Pick<GoogleDriveSession, "accessToken" | "expiresAt">,
  now = Date.now(),
): boolean {
  if (!session.accessToken) return false;
  return session.expiresAt - TOKEN_EXPIRY_SKEW_MS > now;
}

export const useGoogleDriveSessionStore = create<GoogleDriveSessionState>()(
  persist(
    (set) => ({
      accessToken: null,
      expiresAt: 0,
      requireAccountPicker: false,
      upsert: (session) => {
        set({
          accessToken: session.accessToken,
          expiresAt: session.expiresAt,
          requireAccountPicker: false,
        });
      },
      expire: () => {
        set((state) => ({
          accessToken: null,
          expiresAt: 0,
          requireAccountPicker: state.requireAccountPicker,
        }));
      },
      clear: () => {
        set({
          accessToken: null,
          expiresAt: 0,
          requireAccountPicker: true,
        });
      },
    }),
    {
      name: GOOGLE_DRIVE_TOKEN_STORAGE_KEY,
      storage: createJSONStorage(() => sessionStateStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        expiresAt: state.expiresAt,
        requireAccountPicker: state.requireAccountPicker,
      }),
    },
  ),
);

export function readGoogleDriveToken(now = Date.now()): string | null {
  const session = useGoogleDriveSessionStore.getState();
  if (isUsableGoogleDriveSession(session, now)) return session.accessToken;
  if (session.accessToken) session.expire();
  return null;
}

export function hasUsableGoogleDriveToken(now = Date.now()): boolean {
  return isUsableGoogleDriveSession(useGoogleDriveSessionStore.getState(), now);
}

export function googleDriveRequiresAccountPicker(): boolean {
  return useGoogleDriveSessionStore.getState().requireAccountPicker;
}
