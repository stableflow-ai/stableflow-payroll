import type { AuthUser } from "@/types/auth";
import { hasOrganization, isEmployee } from "@/lib/auth-role";

const LOGIN_PATH = "/login";
const REGISTER_PATH = "/register";
export const CREATE_ORGANIZATION_PATH = "/register/organization";
export const INVITE_PATH_PREFIX = "/invite";

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
  if (decoded === LOGIN_PATH || decoded.startsWith(`${LOGIN_PATH}?`) || decoded.startsWith(`${LOGIN_PATH}/`)) {
    return null;
  }
  if (
    decoded === REGISTER_PATH
    || decoded.startsWith(`${REGISTER_PATH}?`)
    || decoded.startsWith(`${REGISTER_PATH}/`)
  ) {
    return null;
  }
  if (
    decoded === CREATE_ORGANIZATION_PATH
    || decoded.startsWith(`${CREATE_ORGANIZATION_PATH}?`)
    || decoded.startsWith(`${CREATE_ORGANIZATION_PATH}/`)
  ) {
    return null;
  }
  if (
    decoded === INVITE_PATH_PREFIX
    || decoded.startsWith(`${INVITE_PATH_PREFIX}?`)
    || decoded.startsWith(`${INVITE_PATH_PREFIX}/`)
  ) {
    return null;
  }
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

export function postAuthPath(user: AuthUser | null | undefined, returnTo: string | null): string {
  if (user && !isEmployee(user) && !hasOrganization(user)) {
    return CREATE_ORGANIZATION_PATH;
  }
  return returnTo ?? "/";
}
