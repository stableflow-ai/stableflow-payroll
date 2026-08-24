const LOGIN_PATH = "/login";
const REGISTER_PATH = "/register";

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
