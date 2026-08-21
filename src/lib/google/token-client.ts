import {
  GOOGLE_CLIENT_ID,
  GOOGLE_DRIVE_FILE_SCOPE,
  TOKEN_EXPIRY_SKEW_MS,
  isGoogleImportConfigured,
} from "./config";
import { loadGoogleScripts } from "./load-scripts";

export class GoogleAuthCancelledError extends Error {
  constructor(message = "Google sign-in cancelled") {
    super(message);
    this.name = "GoogleAuthCancelledError";
  }
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let cached: CachedToken | null = null;
let pendingReject: ((error: Error) => void) | null = null;

function ensureTokenClient(): google.accounts.oauth2.TokenClient {
  if (!isGoogleImportConfigured()) {
    throw new Error("Google Sheets import is not configured");
  }
  const oauth = window.google?.accounts?.oauth2;
  if (!oauth) {
    throw new Error("Google Identity Services failed to load");
  }
  if (!tokenClient) {
    tokenClient = oauth.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GOOGLE_DRIVE_FILE_SCOPE,
      callback: () => {},
      error_callback: (error) => {
        const cancelled = error.type === "popup_closed" || error.type === "popup_failed_to_open";
        pendingReject?.(
          cancelled ? new GoogleAuthCancelledError() : new Error(error.message || error.type),
        );
        pendingReject = null;
      },
    });
  }
  return tokenClient;
}

function requestAccessToken(prompt: string): Promise<google.accounts.oauth2.TokenResponse> {
  return new Promise((resolve, reject) => {
    const client = ensureTokenClient();
    pendingReject = reject;
    client.callback = (response) => {
      pendingReject = null;
      if (response.error) {
        if (response.error === "access_denied" || response.error === "popup_closed") {
          reject(new GoogleAuthCancelledError());
          return;
        }
        reject(new Error(response.error_description || response.error));
        return;
      }
      if (!response.access_token) {
        reject(new Error("Google did not return an access token"));
        return;
      }
      resolve(response);
    };
    client.requestAccessToken({ prompt });
  });
}

function cacheToken(response: google.accounts.oauth2.TokenResponse): string {
  const expiresInMs = Math.max(0, (Number(response.expires_in) || 3600) * 1000);
  cached = {
    accessToken: response.access_token,
    expiresAt: Date.now() + expiresInMs,
  };
  return cached.accessToken;
}

function readCachedToken(): string | null {
  if (!cached) return null;
  if (cached.expiresAt - TOKEN_EXPIRY_SKEW_MS <= Date.now()) return null;
  return cached.accessToken;
}

export function clearGoogleAccessToken(): void {
  cached = null;
}

export async function getDriveFileToken(options?: { interactive?: boolean }): Promise<string> {
  await loadGoogleScripts();
  const existing = readCachedToken();
  if (existing && options?.interactive !== true) return existing;

  const interactive = options?.interactive === true || !cached;
  try {
    const response = await requestAccessToken(interactive ? "select_account" : "");
    return cacheToken(response);
  } catch (error) {
    if (error instanceof GoogleAuthCancelledError) throw error;
    if (!interactive) {
      const response = await requestAccessToken("select_account");
      return cacheToken(response);
    }
    throw error;
  }
}

export function isGoogleAuthCancelled(error: unknown): boolean {
  return error instanceof GoogleAuthCancelledError;
}
