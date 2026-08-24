import { ACCESS_REFRESH_SKEW_MS, SESSION_STORAGE_PREFIX } from "./config";

export interface UserSession {
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

const memory = new Map<string, UserSession>();

function getSessionStorage(): Storage | null {
  try {
    return globalThis.sessionStorage;
  } catch {
    return null;
  }
}

function storageKey(intentsAccountId: string): string {
  return `${SESSION_STORAGE_PREFIX}${intentsAccountId}`;
}

function isUserSession(value: unknown): value is UserSession {
  if (!value || typeof value !== "object") return false;
  const session = value as UserSession;
  return (
    typeof session.intentsAccountId === "string"
    && typeof session.accessExpiresAt === "number"
    && typeof session.refreshExpiresAt === "number"
    && typeof session.signedLocally === "boolean"
    && (session.accessToken === null || typeof session.accessToken === "string")
    && (session.refreshToken === null || typeof session.refreshToken === "string")
  );
}

export function readUserSession(intentsAccountId: string): UserSession | null {
  const cached = memory.get(intentsAccountId);
  if (cached) return cached;
  const storage = getSessionStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(storageKey(intentsAccountId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isUserSession(parsed)) return null;
    memory.set(intentsAccountId, parsed);
    return parsed;
  } catch {
    return null;
  }
}

export function writeUserSession(session: UserSession): void {
  memory.set(session.intentsAccountId, session);
  const storage = getSessionStorage();
  if (!storage) return;
  try {
    storage.setItem(storageKey(session.intentsAccountId), JSON.stringify(session));
  } catch {
    // Ignore quota / private-mode failures; memory still holds the session.
  }
}

export function clearUserSession(intentsAccountId: string): void {
  memory.delete(intentsAccountId);
  const storage = getSessionStorage();
  if (!storage) return;
  try {
    storage.removeItem(storageKey(intentsAccountId));
  } catch {
    // Ignore.
  }
}

export function hasUsableSession(intentsAccountId: string, now = Date.now()): boolean {
  const session = readUserSession(intentsAccountId);
  if (!session) return false;
  if (session.signedLocally) return true;
  if (session.accessExpiresAt > now + ACCESS_REFRESH_SKEW_MS) return true;
  if (session.refreshToken && session.refreshExpiresAt > now) return true;
  return false;
}

export function sessionNeedsRefresh(session: UserSession, now = Date.now()): boolean {
  if (session.signedLocally || !session.accessToken) return false;
  return session.accessExpiresAt <= now + ACCESS_REFRESH_SKEW_MS;
}
