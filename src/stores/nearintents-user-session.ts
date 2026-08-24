import { create } from "zustand";
import { ACCESS_REFRESH_SKEW_MS, NEARINTENTS_USER_SESSION_STORAGE_PREFIX } from "@/lib/confidential/config";
import { refreshUserSession } from "@/lib/confidential/one-click-auth";

/**
 * 1Click / NEAR Intents User-Session (access + refresh), keyed by
 * intentsAccountId. This is not the product login JWT in `useAuthStore`.
 */
export interface NearintentsUserSession {
  intentsAccountId: string;
  accessToken: string | null;
  refreshToken: string | null;
  accessExpiresAt: number;
  refreshExpiresAt: number;
  /**
   * True when the wallet signature succeeded but authenticate was blocked
   * (typically CORS). Requires a proxy or CORS allowlist to issue real tokens.
   */
  signedLocally: boolean;
}

interface NearintentsUserSessionState {
  sessions: Record<string, NearintentsUserSession>;
  upsert: (session: NearintentsUserSession) => void;
  clear: (intentsAccountId: string) => void;
}

function getSessionStorage(): Storage | null {
  try {
    return globalThis.sessionStorage;
  } catch {
    return null;
  }
}

function storageKey(intentsAccountId: string): string {
  return `${NEARINTENTS_USER_SESSION_STORAGE_PREFIX}${intentsAccountId}`;
}

function isNearintentsUserSession(value: unknown): value is NearintentsUserSession {
  if (!value || typeof value !== "object") return false;
  const session = value as NearintentsUserSession;
  return (
    typeof session.intentsAccountId === "string"
    && typeof session.accessExpiresAt === "number"
    && typeof session.refreshExpiresAt === "number"
    && typeof session.signedLocally === "boolean"
    && (session.accessToken === null || typeof session.accessToken === "string")
    && (session.refreshToken === null || typeof session.refreshToken === "string")
  );
}

function hydrateSessions(): Record<string, NearintentsUserSession> {
  const storage = getSessionStorage();
  if (!storage) return {};
  const sessions: Record<string, NearintentsUserSession> = {};
  try {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (!key?.startsWith(NEARINTENTS_USER_SESSION_STORAGE_PREFIX)) continue;
      const raw = storage.getItem(key);
      if (!raw) continue;
      const parsed: unknown = JSON.parse(raw);
      if (!isNearintentsUserSession(parsed)) continue;
      sessions[parsed.intentsAccountId] = parsed;
    }
  } catch {
    return sessions;
  }
  return sessions;
}

export const useNearintentsUserSessionStore = create<NearintentsUserSessionState>((set) => ({
  sessions: hydrateSessions(),
  upsert: (session) => {
    set((state) => ({
      sessions: { ...state.sessions, [session.intentsAccountId]: session },
    }));
    const storage = getSessionStorage();
    if (!storage) return;
    try {
      storage.setItem(storageKey(session.intentsAccountId), JSON.stringify(session));
    } catch {
      // Ignore quota / private-mode failures; memory still holds the session.
    }
  },
  clear: (intentsAccountId) => {
    set((state) => {
      const sessions = { ...state.sessions };
      delete sessions[intentsAccountId];
      return { sessions };
    });
    const storage = getSessionStorage();
    if (!storage) return;
    try {
      storage.removeItem(storageKey(intentsAccountId));
    } catch {
      // Ignore.
    }
  },
}));

export function readNearintentsUserSession(intentsAccountId: string): NearintentsUserSession | null {
  return useNearintentsUserSessionStore.getState().sessions[intentsAccountId] ?? null;
}

export function sessionNeedsRefresh(session: NearintentsUserSession, now = Date.now()): boolean {
  if (session.signedLocally || !session.accessToken) return false;
  return session.accessExpiresAt <= now + ACCESS_REFRESH_SKEW_MS;
}

export function hasUsableNearintentsUserSession(intentsAccountId: string, now = Date.now()): boolean {
  const session = readNearintentsUserSession(intentsAccountId);
  if (!session) return false;
  if (session.signedLocally) return true;
  if (session.accessExpiresAt > now + ACCESS_REFRESH_SKEW_MS) return true;
  if (session.refreshToken && session.refreshExpiresAt > now) return true;
  return false;
}

export async function getNearintentsAccessToken(intentsAccountId: string): Promise<string | null> {
  const store = useNearintentsUserSessionStore.getState();
  const session = store.sessions[intentsAccountId];
  if (!session) return null;
  if (session.signedLocally) return null;
  if (!sessionNeedsRefresh(session)) return session.accessToken;
  if (!session.refreshToken) {
    store.clear(intentsAccountId);
    return null;
  }
  try {
    const next = await refreshUserSession(session.refreshToken);
    const updated: NearintentsUserSession = {
      ...session,
      accessToken: next.accessToken,
      accessExpiresAt: Date.now() + Math.max(next.expiresIn, 1) * 1000,
    };
    store.upsert(updated);
    return updated.accessToken;
  } catch {
    store.clear(intentsAccountId);
    return null;
  }
}
