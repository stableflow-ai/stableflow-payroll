import { AUTH_USER_ROLE, type AuthOrganization, type AuthSession, type AuthUser } from "@/types/auth";

const SESSION_KEY = "stableflow-pay.session";

let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(handler: () => void): void {
  onUnauthorized = handler;
}

export function notifyUnauthorized(): void {
  onUnauthorized?.();
}

function getStorage(): Storage | null {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function hydrateOrganization(value: unknown): AuthOrganization | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!value || typeof value !== "object") return undefined;
  const name = (value as { name?: unknown }).name;
  if (typeof name !== "string") return undefined;
  const trimmed = name.trim();
  return trimmed ? { name: trimmed } : null;
}

function isAuthUserRecord(value: unknown): value is {
  id: number;
  email: string;
  name: string;
  role?: unknown;
  organization?: unknown;
} {
  if (!value || typeof value !== "object") return false;
  const user = value as AuthUser;
  return (
    typeof user.id === "number" &&
    typeof user.email === "string" &&
    typeof user.name === "string"
  );
}

function hydrateUser(user: {
  id: number;
  email: string;
  name: string;
  role?: unknown;
  organization?: unknown;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role === AUTH_USER_ROLE.Employee ? AUTH_USER_ROLE.Employee : AUTH_USER_ROLE.Admin,
    organization: hydrateOrganization(user.organization),
  };
}

function isAuthSessionRecord(value: unknown): value is {
  token: string;
  user: { id: number; email: string; name: string; role?: unknown; organization?: unknown };
} {
  if (!value || typeof value !== "object") return false;
  const session = value as AuthSession;
  return (
    typeof session.token === "string" &&
    session.token.length > 0 &&
    isAuthUserRecord(session.user)
  );
}

export function getStoredSession(): AuthSession | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isAuthSessionRecord(parsed)) return null;
    return { token: parsed.token, user: hydrateUser(parsed.user) };
  } catch {
    return null;
  }
}

export function getAuthToken(): string | null {
  return getStoredSession()?.token ?? null;
}

export function setStoredSession(token: string, user: AuthUser): void {
  const storage = getStorage();
  if (!storage) return;
  const session: AuthSession = { token, user };
  storage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearStoredSession(): void {
  try {
    getStorage()?.removeItem(SESSION_KEY);
  } catch {
    // Ignore storage failures (private mode, etc.).
  }
}
