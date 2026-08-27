import {
  GOOGLE_CLIENT_ID,
  GOOGLE_DRIVE_FILE_SCOPE,
  GOOGLE_OAUTH_PROMPT_NONE,
  GOOGLE_OAUTH_PROMPT_SELECT_ACCOUNT,
  isGoogleImportConfigured,
} from "./config";
import { loadGoogleScripts } from "./load-scripts";
import {
  googleDriveRequiresAccountPicker,
  readGoogleDriveToken,
  useGoogleDriveSessionStore,
} from "@/stores/google-drive-session";

export class GoogleAuthCancelledError extends Error {
  constructor(message = "Google sign-in cancelled") {
    super(message);
    this.name = "GoogleAuthCancelledError";
  }
}

let tokenClient: google.accounts.oauth2.TokenClient | null = null;
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
  const accessToken = response.access_token;
  useGoogleDriveSessionStore.getState().upsert({
    accessToken,
    expiresAt: Date.now() + expiresInMs,
  });
  return accessToken;
}

export async function getDriveFileToken(options?: { interactive?: boolean }): Promise<string> {
  await loadGoogleScripts();
  const existing = readGoogleDriveToken();
  if (existing && options?.interactive !== true) return existing;

  const forcePicker = options?.interactive === true || googleDriveRequiresAccountPicker();
  try {
    const response = await requestAccessToken(
      forcePicker ? GOOGLE_OAUTH_PROMPT_SELECT_ACCOUNT : GOOGLE_OAUTH_PROMPT_NONE,
    );
    return cacheToken(response);
  } catch (error) {
    if (error instanceof GoogleAuthCancelledError) throw error;
    if (!forcePicker) {
      const response = await requestAccessToken(GOOGLE_OAUTH_PROMPT_SELECT_ACCOUNT);
      return cacheToken(response);
    }
    throw error;
  }
}

export async function signOutGoogleDrive(): Promise<void> {
  const accessToken = useGoogleDriveSessionStore.getState().accessToken;
  useGoogleDriveSessionStore.getState().clear();
  if (!accessToken) return;
  try {
    await loadGoogleScripts();
    const oauth = window.google?.accounts?.oauth2;
    if (!oauth?.revoke) return;
    await new Promise<void>((resolve) => {
      oauth.revoke(accessToken, () => resolve());
    });
  } catch {
    // Local session is already cleared.
  }
}

export function isGoogleAuthCancelled(error: unknown): boolean {
  return error instanceof GoogleAuthCancelledError;
}
