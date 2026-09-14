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
      function revoke(accessToken: string, done?: () => void): void;
    }

    namespace id {
      interface CredentialResponse {
        credential: string;
        select_by?: string;
        clientId?: string;
        state?: string;
      }

      interface PromptMomentNotification {
        isDisplayMoment: () => boolean;
        isDisplayed: () => boolean;
        isNotDisplayed: () => boolean;
        getNotDisplayedReason: () => string;
        isSkippedMoment: () => boolean;
        getSkippedReason: () => string;
        isDismissedMoment: () => boolean;
        getDismissedReason: () => string;
        getMomentType: () => string;
      }

      interface IdConfiguration {
        client_id: string;
        callback?: (response: CredentialResponse) => void;
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
        ux_mode?: "popup" | "redirect";
        use_fedcm_for_prompt?: boolean;
        itp_support?: boolean;
      }

      interface GsiButtonConfiguration {
        type?: "standard" | "icon";
        theme?: "outline" | "filled_blue" | "filled_black";
        size?: "large" | "medium" | "small";
        text?: "signin_with" | "signup_with" | "continue_with" | "signin";
        shape?: "rectangular" | "pill" | "circle" | "square";
        logo_alignment?: "left" | "center";
        width?: number | string;
        locale?: string;
      }

      function initialize(config: IdConfiguration): void;
      function prompt(momentListener?: (notification: PromptMomentNotification) => void): void;
      function renderButton(parent: HTMLElement, options?: GsiButtonConfiguration): void;
      function disableAutoSelect(): void;
      function cancel(): void;
    }
  }
}

interface Window {
  google: typeof google;
  gapi: typeof gapi;
}
