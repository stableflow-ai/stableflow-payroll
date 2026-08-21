export const GSI_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
export const GAPI_SCRIPT_SRC = "https://apis.google.com/js/api.js";
export const GOOGLE_DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";
export const SHEETS_API_BASE = "https://sheets.googleapis.com/v4";
export const TOKEN_EXPIRY_SKEW_MS = 60_000;

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
export const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY ?? "";
export const GOOGLE_APP_ID = import.meta.env.VITE_GOOGLE_APP_ID ?? "";

export function isGoogleImportConfigured(): boolean {
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_API_KEY && GOOGLE_APP_ID);
}
