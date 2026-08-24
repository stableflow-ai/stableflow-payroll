import type { IntentSignedPayload } from "@/wallet";
import { ONE_CLICK_API_URL } from "./config";

export interface UserAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export interface UserRefreshResponse {
  accessToken: string;
  expiresIn: number;
}

export class OneClickAuthError extends Error {
  status: number;
  corsLikely: boolean;

  constructor(message: string, status = 0, corsLikely = false) {
    super(message);
    this.name = "OneClickAuthError";
    this.status = status;
    this.corsLikely = corsLikely;
  }
}

function isCorsFailure(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const text = error.message.toLowerCase();
  return (
    error.name === "TypeError"
    || text.includes("failed to fetch")
    || text.includes("networkerror")
    || text.includes("cors")
    || text.includes("load failed")
  );
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function readErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const record = payload as { message?: unknown; error?: unknown };
  if (typeof record.message === "string" && record.message) return record.message;
  if (typeof record.error === "string" && record.error) return record.error;
  return fallback;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${ONE_CLICK_API_URL}${path}`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new OneClickAuthError(
      error instanceof Error ? error.message : "Network error",
      0,
      isCorsFailure(error),
    );
  }

  const payload = await parseJson(res);
  if (!res.ok) {
    throw new OneClickAuthError(readErrorMessage(payload, `Request failed (${res.status})`), res.status);
  }
  return payload as T;
}

export async function authenticateUser(signedData: IntentSignedPayload): Promise<UserAuthResponse> {
  return postJson<UserAuthResponse>("/v0/auth/authenticate", { signedData });
}

export async function refreshUserSession(refreshToken: string): Promise<UserRefreshResponse> {
  return postJson<UserRefreshResponse>("/v0/auth/refresh", { refreshToken });
}

export interface PrivateBalance {
  tokenId: string;
  available: string;
  source: string;
}

export interface PrivateBalancesResp {
  balances: PrivateBalance[];
}

function parsePrivateBalances(payload: unknown): PrivateBalance[] {
  if (!payload || typeof payload !== "object") return [];
  const rows = (payload as { balances?: unknown }).balances;
  if (!Array.isArray(rows)) return [];
  const out: PrivateBalance[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const record = row as Record<string, unknown>;
    if (typeof record.tokenId !== "string") continue;
    const available = typeof record.available === "string" || typeof record.available === "number"
      ? String(record.available)
      : "";
    if (!available) continue;
    out.push({
      tokenId: record.tokenId,
      available,
      source: typeof record.source === "string" ? record.source : "",
    });
  }
  return out;
}

export function privateAvailableForToken(balances: PrivateBalance[], tokenId: string): string {
  const privateMatch = balances.find((row) => row.tokenId === tokenId && row.source === "private");
  if (privateMatch) return privateMatch.available;
  const anyMatch = balances.find((row) => row.tokenId === tokenId);
  return anyMatch?.available ?? "0";
}

export async function getPrivateBalances(
  accessToken: string,
  tokenIds?: string[],
): Promise<PrivateBalance[]> {
  const query = tokenIds?.length ? `?tokenIds=${encodeURIComponent(tokenIds.join(","))}` : "";
  let res: Response;
  try {
    res = await fetch(`${ONE_CLICK_API_URL}/v0/account/balances${query}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${accessToken}` },
    });
  } catch (error) {
    throw new OneClickAuthError(
      error instanceof Error ? error.message : "Network error",
      0,
      isCorsFailure(error),
    );
  }
  const payload = await parseJson(res);
  if (!res.ok) {
    throw new OneClickAuthError(readErrorMessage(payload, `Request failed (${res.status})`), res.status);
  }
  return parsePrivateBalances(payload);
}

/**
 * Optional private-balance probe. Failures must not block activation.
 */
export async function probePrivateBalances(accessToken: string): Promise<PrivateBalance[] | null> {
  try {
    return await getPrivateBalances(accessToken);
  } catch {
    return null;
  }
}
