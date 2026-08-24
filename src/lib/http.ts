import { ApiError } from "@/lib/api-error";
import { clearStoredSession, getAuthToken, notifyUnauthorized } from "@/lib/auth-session";

const SUCCESS_CODE = 200;

type HttpMethod = "GET" | "POST" | "DELETE";

export type HttpQueryValue = string | number | boolean | null | undefined;

export interface HttpOptions {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, HttpQueryValue>;
  /** When true, send `Authorization: Bearer {token}`. Default true. */
  auth?: boolean;
}

interface Envelope<T> {
  code?: number;
  data?: T;
  message?: string;
}

function apiBaseUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!base) {
    throw new ApiError("API base URL is not configured", 500, "CONFIG");
  }
  return base.replace(/\/+$/, "");
}

function joinUrl(path: string): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${apiBaseUrl()}${suffix}`;
}

function withQuery(path: string, query?: Record<string, HttpQueryValue>): string {
  if (!query) return path;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  if (!qs) return path;
  return path.includes("?") ? `${path}&${qs}` : `${path}?${qs}`;
}

function readMessage(payload: Envelope<unknown> | null, fallback: string): string {
  const message = payload?.message?.trim();
  return message || fallback;
}

export async function http<T>(path: string, options: HttpOptions = {}): Promise<T> {
  const { method = "GET", body, query, auth = true } = options;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (auth) {
    const token = getAuthToken();
    if (!token) {
      throw new ApiError("Not authenticated", 401, "UNAUTHENTICATED");
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const url = joinUrl(withQuery(path, query));
  const res = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let payload: Envelope<T> | null = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text) as Envelope<T>;
    } catch {
      payload = null;
    }
  }

  const message = readMessage(payload, res.statusText || "Request failed");

  if (!res.ok) {
    if (res.status === 401 && auth) {
      clearStoredSession();
      notifyUnauthorized();
    }
    throw new ApiError(
      message,
      res.status,
      payload?.code != null ? String(payload.code) : undefined,
    );
  }

  if (payload?.code !== SUCCESS_CODE) {
    if (res.ok && payload == null && method === "DELETE") {
      return undefined as T;
    }
    throw new ApiError(
      message,
      res.status,
      payload?.code != null ? String(payload.code) : undefined,
    );
  }

  return payload.data as T;
}
