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

function optionalTrimmed(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function hydrateOrganization(value: unknown): AuthOrganization | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!value || typeof value !== "object") return undefined;
  const row = value as { id?: unknown; name?: unknown; logo?: unknown; orgId?: unknown };
  if (typeof row.name !== "string") return undefined;
  const name = row.name.trim();
  if (!name) return null;
  const id = typeof row.id === "number" && Number.isFinite(row.id) ? row.id : 0;
  const logo = typeof row.logo === "string" ? row.logo.trim() : "";
  const orgId = optionalTrimmed(row.orgId);
  return {
    id,
    name,
    ...(logo ? { logo } : {}),
    ...(orgId ? { orgId } : {}),
  };
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

export function hydrateAuthUser(user: {
  id: number;
  email: string;
  name: string;
  role?: unknown;
  telegram?: unknown;
  slack?: unknown;
  organization?: unknown;
}): AuthUser {
  const telegram = optionalTrimmed(user.telegram);
  const slack = optionalTrimmed(user.slack);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role === AUTH_USER_ROLE.User ? AUTH_USER_ROLE.User : AUTH_USER_ROLE.Admin,
    ...(telegram ? { telegram } : {}),
    ...(slack ? { slack } : {}),
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
    return { token: parsed.token, user: hydrateAuthUser(parsed.user) };
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
  const session: AuthSession = { token, user: hydrateAuthUser(user) };
  storage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearStoredSession(): void {
  try {
    getStorage()?.removeItem(SESSION_KEY);
  } catch {
    // Ignore storage failures (private mode, etc.).
  }
}
