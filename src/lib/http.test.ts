import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "./api-error";
import {
  clearStoredSession,
  getAuthToken,
  setOnUnauthorized,
  setStoredSession,
} from "./auth-session";
import { http } from "./http";

const API_BASE = "https://test-api.stableflow.ai";

const SAMPLE_USER = { id: 1, email: "a@b.com", name: "Ada" };

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key) {
      map.delete(key);
    },
    setItem(key, value) {
      map.set(String(key), String(value));
    },
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("http", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", API_BASE);
    vi.stubGlobal("localStorage", createMemoryStorage());
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    setOnUnauthorized(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    setOnUnauthorized(() => {});
  });

  it("unwraps data when code is 200", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ code: 200, data: { ok: true } }));
    const data = await http<{ ok: boolean }>("/v1/pay/auth/login", {
      method: "POST",
      body: { email: "a@b.com", password: "x" },
      auth: false,
    });
    expect(data).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${API_BASE}/v1/pay/auth/login`);
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ email: "a@b.com", password: "x" }));
  });

  it("throws ApiError when business code is not 200", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ code: 400, message: "Invalid credentials", data: null }),
    );
    await expect(
      http("/v1/pay/auth/login", { method: "POST", body: {}, auth: false }),
    ).rejects.toMatchObject({
      name: "ApiError",
      message: "Invalid credentials",
      status: 200,
      code: "400",
    } satisfies Partial<ApiError>);
  });

  it("sends Authorization Bearer when auth is true", async () => {
    setStoredSession("tok-1", SAMPLE_USER);
    fetchMock.mockResolvedValueOnce(jsonResponse({ code: 200, data: { id: 9 } }));
    await http<{ id: number }>("/v1/pay/order/9");
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok-1");
  });

  it("throws without fetching when auth is required and no token is stored", async () => {
    await expect(http("/v1/pay/batch/quote", { method: "POST", body: {} })).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      code: "UNAUTHENTICATED",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("omits Authorization when auth is false", async () => {
    setStoredSession("tok-1", SAMPLE_USER);
    fetchMock.mockResolvedValueOnce(jsonResponse({ code: 200, data: {} }));
    await http("/v1/pay/auth/register", { method: "POST", body: {}, auth: false });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it("appends GET query params and skips nullish values", async () => {
    setStoredSession("tok-1", SAMPLE_USER);
    fetchMock.mockResolvedValueOnce(jsonResponse({ code: 200, data: [] }));
    await http("/v1/pay/order/1", { query: { page: 2, q: "ada", empty: undefined, none: null } });
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${API_BASE}/v1/pay/order/1?page=2&q=ada`);
  });

  it("clears the session and notifies on HTTP 401", async () => {
    setStoredSession("tok-1", SAMPLE_USER);
    const onUnauthorized = vi.fn();
    setOnUnauthorized(onUnauthorized);
    fetchMock.mockResolvedValueOnce(jsonResponse({ code: 401, message: "Expired" }, 401));

    await expect(http("/v1/pay/order/1")).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      message: "Expired",
    });
    expect(getAuthToken()).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it("clearStoredSession is a no-op when nothing is stored", () => {
    expect(() => clearStoredSession()).not.toThrow();
    expect(getAuthToken()).toBeNull();
  });
});
