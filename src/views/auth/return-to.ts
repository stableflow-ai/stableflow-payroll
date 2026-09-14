import type { AuthUser } from "@/types/auth";

const LOGIN_PATH = "/login";
const REGISTER_PATH = "/register";
export const CREATE_ORGANIZATION_PATH = "/register/organization";
export const INVITE_PATH_PREFIX = "/invite";
export const AUTH_GOOGLE_PATH_PREFIX = "/auth/google";

function isAuthBouncePath(decoded: string, path: string): boolean {
  return decoded === path || decoded.startsWith(`${path}?`) || decoded.startsWith(`${path}/`);
}

export function safeReturnTo(value: string | null | undefined): string | null {
  if (!value) return null;
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return null;
  }
  if (!decoded.startsWith("/")) return null;
  if (decoded.startsWith("//")) return null;
  if (isAuthBouncePath(decoded, LOGIN_PATH)) return null;
  if (isAuthBouncePath(decoded, REGISTER_PATH)) return null;
  if (isAuthBouncePath(decoded, CREATE_ORGANIZATION_PATH)) return null;
  if (isAuthBouncePath(decoded, INVITE_PATH_PREFIX)) return null;
  if (isAuthBouncePath(decoded, AUTH_GOOGLE_PATH_PREFIX)) return null;
  return decoded;
}

export function loginPathWithReturnTo(returnTo: string | null): string {
  if (!returnTo) return LOGIN_PATH;
  return `${LOGIN_PATH}?returnTo=${encodeURIComponent(returnTo)}`;
}

export function registerPathWithReturnTo(returnTo: string | null): string {
  if (!returnTo) return REGISTER_PATH;
  return `${REGISTER_PATH}?returnTo=${encodeURIComponent(returnTo)}`;
}

export function returnToFromSearch(search: string): string | null {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return safeReturnTo(params.get("returnTo"));
}

export function postAuthPath(_user: AuthUser | null | undefined, returnTo: string | null): string {
  return returnTo ?? "/";
}
