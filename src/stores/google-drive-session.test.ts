import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GOOGLE_DRIVE_TOKEN_STORAGE_KEY } from "@/lib/google/config";
import {
  googleDriveRequiresAccountPicker,
  hasUsableGoogleDriveToken,
  hydrateGoogleDriveSession,
  readGoogleDriveToken,
  useGoogleDriveSessionStore,
} from "./google-drive-session";

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

function resetStore() {
  useGoogleDriveSessionStore.setState({
    accessToken: null,
    expiresAt: 0,
    requireAccountPicker: false,
  });
}

describe("google-drive-session", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = createMemoryStorage();
    vi.stubGlobal("sessionStorage", storage);
    resetStore();
  });

  afterEach(() => {
    resetStore();
    vi.unstubAllGlobals();
  });

  it("hydrates a stored unexpired session", () => {
    storage.setItem(GOOGLE_DRIVE_TOKEN_STORAGE_KEY, JSON.stringify({
      accessToken: "ya29.token",
      expiresAt: Date.now() + 120_000,
      requireAccountPicker: false,
    }));
    expect(hydrateGoogleDriveSession().accessToken).toBe("ya29.token");
  });

  it("upserts to memory and sessionStorage", () => {
    useGoogleDriveSessionStore.getState().upsert({
      accessToken: "ya29.live",
      expiresAt: Date.now() + 120_000,
    });
    expect(hasUsableGoogleDriveToken()).toBe(true);
    expect(readGoogleDriveToken()).toBe("ya29.live");
    const stored = JSON.parse(storage.getItem(GOOGLE_DRIVE_TOKEN_STORAGE_KEY) ?? "null") as {
      accessToken: string;
      requireAccountPicker: boolean;
    };
    expect(stored.accessToken).toBe("ya29.live");
    expect(stored.requireAccountPicker).toBe(false);
    expect(googleDriveRequiresAccountPicker()).toBe(false);
  });

  it("treats an expired token as unusable and expires it without forcing the account picker", () => {
    useGoogleDriveSessionStore.getState().upsert({
      accessToken: "ya29.old",
      expiresAt: Date.now() - 1_000,
    });
    expect(hasUsableGoogleDriveToken()).toBe(false);
    expect(readGoogleDriveToken()).toBeNull();
    expect(useGoogleDriveSessionStore.getState().accessToken).toBeNull();
    expect(googleDriveRequiresAccountPicker()).toBe(false);
  });

  it("clear drops the token and requires the account picker next time", () => {
    useGoogleDriveSessionStore.getState().upsert({
      accessToken: "ya29.live",
      expiresAt: Date.now() + 120_000,
    });
    useGoogleDriveSessionStore.getState().clear();
    expect(hasUsableGoogleDriveToken()).toBe(false);
    expect(readGoogleDriveToken()).toBeNull();
    expect(googleDriveRequiresAccountPicker()).toBe(true);
    const stored = JSON.parse(storage.getItem(GOOGLE_DRIVE_TOKEN_STORAGE_KEY) ?? "null") as {
      accessToken: string | null;
      requireAccountPicker: boolean;
    };
    expect(stored.accessToken).toBeNull();
    expect(stored.requireAccountPicker).toBe(true);
  });
});
