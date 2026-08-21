/// <reference types="vite/client" />

interface Window {
  Buffer: typeof import("buffer").Buffer;
}

interface ImportMetaEnv {
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
  readonly VITE_RPC_PROXY_HOST?: string;
  readonly VITE_RPC_SECRET_KEY?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_AMOUNT_MAX_DECIMALS?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_GOOGLE_API_KEY?: string;
  readonly VITE_GOOGLE_APP_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
