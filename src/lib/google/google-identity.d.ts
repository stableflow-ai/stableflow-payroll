declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenResponse {
        access_token: string;
        expires_in: number;
        scope?: string;
        token_type?: string;
        error?: string;
        error_description?: string;
      }

      interface TokenClientConfig {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
        error_callback?: (error: { type: string; message?: string }) => void;
      }

      interface TokenClient {
        callback: (response: TokenResponse) => void;
        requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
      }

      function initTokenClient(config: TokenClientConfig): TokenClient;
    }
  }
}

interface Window {
  google: typeof google;
  gapi: typeof gapi;
}
