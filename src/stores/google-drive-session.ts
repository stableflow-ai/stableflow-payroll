import { create } from "zustand";
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

function getSessionStorage(): Storage | null {
  try {
    return globalThis.sessionStorage;
  } catch {
    return null;
  }
}

function isGoogleDriveSession(value: unknown): value is GoogleDriveSession {
  if (!value || typeof value !== "object") return false;
  const session = value as GoogleDriveSession;
  return (
    (session.accessToken === null || typeof session.accessToken === "string")
    && typeof session.expiresAt === "number"
    && typeof session.requireAccountPicker === "boolean"
  );
}

function emptySession(): GoogleDriveSession {
  return { accessToken: null, expiresAt: 0, requireAccountPicker: false };
}

function persist(session: GoogleDriveSession): void {
  const storage = getSessionStorage();
  if (!storage) return;
  try {
    storage.setItem(GOOGLE_DRIVE_TOKEN_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ignore quota / private-mode failures; memory still holds the session.
  }
}

export function hydrateGoogleDriveSession(): GoogleDriveSession {
  const storage = getSessionStorage();
  if (!storage) return emptySession();
  try {
    const raw = storage.getItem(GOOGLE_DRIVE_TOKEN_STORAGE_KEY);
    if (!raw) return emptySession();
    const parsed: unknown = JSON.parse(raw);
    if (!isGoogleDriveSession(parsed)) return emptySession();
    return parsed;
  } catch {
    return emptySession();
  }
}

export function isUsableGoogleDriveSession(
  session: Pick<GoogleDriveSession, "accessToken" | "expiresAt">,
  now = Date.now(),
): boolean {
  if (!session.accessToken) return false;
  return session.expiresAt - TOKEN_EXPIRY_SKEW_MS > now;
}

export const useGoogleDriveSessionStore = create<GoogleDriveSessionState>((set) => ({
  ...hydrateGoogleDriveSession(),
  upsert: (session) => {
    const next: GoogleDriveSession = {
      accessToken: session.accessToken,
      expiresAt: session.expiresAt,
      requireAccountPicker: false,
    };
    set(next);
    persist(next);
  },
  expire: () => {
    set((state) => {
      const next: GoogleDriveSession = {
        accessToken: null,
        expiresAt: 0,
        requireAccountPicker: state.requireAccountPicker,
      };
      persist(next);
      return next;
    });
  },
  clear: () => {
    const next: GoogleDriveSession = {
      accessToken: null,
      expiresAt: 0,
      requireAccountPicker: true,
    };
    set(next);
    persist(next);
  },
}));

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
