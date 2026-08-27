import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GOOGLE_OAUTH_PROMPT_SELECT_ACCOUNT } from "./config";
import { useGoogleDriveSessionStore } from "@/stores/google-drive-session";

vi.mock("./load-scripts", () => ({
  loadGoogleScripts: vi.fn(async () => {}),
}));

vi.mock("./config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./config")>();
  return {
    ...actual,
    isGoogleImportConfigured: () => true,
    GOOGLE_CLIENT_ID: "test-client-id",
    GOOGLE_API_KEY: "test-api-key",
    GOOGLE_APP_ID: "test-app-id",
  };
});

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

describe("getDriveFileToken", () => {
  const requestAccessToken = vi.fn();
  const revoke = vi.fn((_token: string, done?: () => void) => {
    done?.();
  });
  const client = {
    callback: (_response: google.accounts.oauth2.TokenResponse) => {},
    requestAccessToken,
  };

  beforeEach(() => {
    vi.stubGlobal("sessionStorage", createMemoryStorage());
    resetStore();
    requestAccessToken.mockReset();
    requestAccessToken.mockImplementation((override?: { prompt?: string }) => {
      expect(override?.prompt).toBe(GOOGLE_OAUTH_PROMPT_SELECT_ACCOUNT);
      client.callback({ access_token: "ya29.next", expires_in: 3600 });
    });
    revoke.mockClear();
    const google = {
      accounts: {
        oauth2: {
          initTokenClient: vi.fn(() => client),
          revoke,
        },
      },
    };
    vi.stubGlobal("google", google);
    vi.stubGlobal("window", { google });
  });

  afterEach(() => {
    resetStore();
    vi.unstubAllGlobals();
  });

  it("returns a usable stored token without prompting Google", async () => {
    useGoogleDriveSessionStore.getState().upsert({
      accessToken: "ya29.cached",
      expiresAt: Date.now() + 120_000,
    });
    const { getDriveFileToken } = await import("./token-client");
    await expect(getDriveFileToken()).resolves.toBe("ya29.cached");
    expect(requestAccessToken).not.toHaveBeenCalled();
  });

  it("opens the account picker after sign-out", async () => {
    const { getDriveFileToken, signOutGoogleDrive } = await import("./token-client");
    useGoogleDriveSessionStore.getState().upsert({
      accessToken: "ya29.cached",
      expiresAt: Date.now() + 120_000,
    });
    await signOutGoogleDrive();
    expect(revoke).toHaveBeenCalled();
    await expect(getDriveFileToken()).resolves.toBe("ya29.next");
    expect(requestAccessToken).toHaveBeenCalledWith({ prompt: GOOGLE_OAUTH_PROMPT_SELECT_ACCOUNT });
  });
});
