import { ApiError } from "@/lib/api-error";
import { clearStoredSession, getAuthToken, notifyUnauthorized } from "@/lib/auth-session";

const SUCCESS_CODE = 200;
const DEFAULT_BLOB_FILENAME = "download";

type HttpMethod = "GET" | "POST" | "DELETE";

export type HttpQueryValue = string | number | boolean | null | undefined;

export interface HttpOptions {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, HttpQueryValue>;
  /** When true, send `Authorization: Bearer {token}`. Default true. */
  auth?: boolean;
  /**
   * When true (default), require `{ code: 200, data }`.
   * `/v1/nearintents/*` proxies 1Click and may return the upstream JSON as-is.
   */
  envelope?: boolean;
}

export interface HttpBlobOptions extends Omit<HttpOptions, "envelope"> {
  fallbackFilename?: string;
}

export interface HttpBlobResult {
  blob: Blob;
  filename: string;
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

function isEnvelope(payload: Envelope<unknown> | null): payload is Envelope<unknown> {
  return payload != null && typeof payload.code === "number";
}

function parseJsonEnvelope(text: string): Envelope<unknown> | null {
  if (!text) return null;
  try {
    return JSON.parse(text) as Envelope<unknown>;
  } catch {
    return null;
  }
}

function isJsonContentType(contentType: string | null): boolean {
  return Boolean(contentType?.toLowerCase().includes("application/json"));
}

export function filenameFromContentDisposition(
  header: string | null | undefined,
  fallback = DEFAULT_BLOB_FILENAME,
): string {
  if (!header) return fallback;
  const star = /filename\*\s*=\s*(?:UTF-8'')?([^;]+)/i.exec(header);
  if (star?.[1]) {
    const raw = star[1].trim().replace(/^"(.*)"$/s, "$1");
    try {
      return decodeURIComponent(raw) || fallback;
    } catch {
      return raw || fallback;
    }
  }
  const quoted = /filename\s*=\s*"((?:[^"\\]|\\.)*)"/i.exec(header);
  if (quoted?.[1]) return quoted[1].replace(/\\"/g, '"') || fallback;
  const plain = /filename\s*=\s*([^;]+)/i.exec(header);
  if (plain?.[1]) return plain[1].trim().replace(/^"(.*)"$/, "$1") || fallback;
  return fallback;
}

async function send(path: string, options: HttpOptions, accept: string): Promise<Response> {
  const { method = "GET", body, query, auth = true } = options;
  const headers: Record<string, string> = { Accept: accept };
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

  return fetch(joinUrl(withQuery(path, query)), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function throwHttpError(
  res: Response,
  payload: Envelope<unknown> | null,
  auth: boolean,
): never {
  if (res.status === 401 && auth) {
    clearStoredSession();
    notifyUnauthorized();
  }
  throw new ApiError(
    readMessage(payload, res.statusText || "Request failed"),
    res.status,
    payload?.code != null ? String(payload.code) : undefined,
  );
}

export async function http<T>(path: string, options: HttpOptions = {}): Promise<T> {
  const { method = "GET", auth = true, envelope = true } = options;
  const res = await send(path, options, "application/json");

  let payload: Envelope<T> | null = null;
  const text = await res.text();
  if (text) {
    payload = parseJsonEnvelope(text) as Envelope<T> | null;
  }

  const message = readMessage(payload, res.statusText || "Request failed");

  if (!res.ok) {
    throwHttpError(res, payload, auth);
  }

  if (!envelope) {
    if (isEnvelope(payload) && payload.code !== SUCCESS_CODE) {
      throw new ApiError(
        message,
        res.status,
        payload.code != null ? String(payload.code) : undefined,
      );
    }
    if (isEnvelope(payload) && payload.code === SUCCESS_CODE) {
      return payload.data as T;
    }
    return payload as T;
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

export async function httpBlob(
  path: string,
  options: HttpBlobOptions = {},
): Promise<HttpBlobResult> {
  const { auth = true, fallbackFilename = DEFAULT_BLOB_FILENAME } = options;
  const res = await send(path, options, "text/csv, application/json");
  const buffer = await res.arrayBuffer();
  const contentType = res.headers.get("content-type");
  const text = isJsonContentType(contentType) || !res.ok
    ? new TextDecoder().decode(buffer)
    : "";
  const payload = parseJsonEnvelope(text);

  if (!res.ok) {
    throwHttpError(res, payload, auth);
  }

  if (isEnvelope(payload) && payload.code !== SUCCESS_CODE) {
    throw new ApiError(
      readMessage(payload, res.statusText || "Request failed"),
      res.status,
      payload.code != null ? String(payload.code) : undefined,
    );
  }

  const type = contentType?.split(";")[0]?.trim() || "application/octet-stream";
  return {
    blob: new Blob([buffer], { type }),
    filename: filenameFromContentDisposition(
      res.headers.get("content-disposition"),
      fallbackFilename,
    ),
  };
}
