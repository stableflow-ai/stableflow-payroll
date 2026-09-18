import { SOLANA_WC_SESSION_POLL_MS, SOLANA_WC_SILENT_SESSION_TIMEOUT_MS } from "./config";

export class QRCodeModalError extends Error {
  constructor() {
    super("QR Code Modal closed");
    this.name = "QRCodeModalError";
  }
}

export type WalletConnectSession = {
  namespaces?: {
    solana?: {
      accounts?: string[];
    };
  };
};

export function hasSolanaAccount(session: unknown): session is WalletConnectSession {
  if (!session || typeof session !== "object") return false;
  const accounts = (session as WalletConnectSession).namespaces?.solana?.accounts;
  return Array.isArray(accounts) && typeof accounts[0] === "string" && accounts[0].length > 0;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function waitForExistingWalletConnectSession(
  getSession: () => WalletConnectSession | undefined,
  options?: { pollIntervalMs?: number; timeoutMs?: number },
): Promise<WalletConnectSession | undefined> {
  const pollIntervalMs = options?.pollIntervalMs ?? SOLANA_WC_SESSION_POLL_MS;
  const timeoutMs = options?.timeoutMs ?? SOLANA_WC_SILENT_SESSION_TIMEOUT_MS;
  const deadline = Date.now() + timeoutMs;
  while (true) {
    const current = getSession();
    if (hasSolanaAccount(current)) return current;
    if (Date.now() >= deadline) return undefined;
    await sleep(pollIntervalMs);
  }
}

export type WaitForWalletConnectSessionOptions = {
  connectProvider: () => Promise<WalletConnectSession | undefined>;
  getSession: () => WalletConnectSession | undefined;
  subscribeModalState: (callback: (open: boolean) => void) => (() => void) | void;
  openModal: () => void;
  closeModal: () => void;
  pollIntervalMs?: number;
  subscribeDisplayUri?: (callback: (uri: string) => void) => (() => void) | void;
  onDisplayUri?: (uri: string) => void;
};

export async function waitForWalletConnectSession(
  options: WaitForWalletConnectSessionOptions,
): Promise<WalletConnectSession> {
  const existing = options.getSession();
  if (hasSolanaAccount(existing)) return existing;

  let settled = false;
  let seenOpen = false;
  let unsubscribeState: (() => void) | undefined;
  let unsubscribeUri: (() => void) | undefined;
  let pollId: ReturnType<typeof setInterval> | undefined;

  const finish = (action: () => void) => {
    if (settled) return;
    settled = true;
    action();
  };

  try {
    const session = await new Promise<WalletConnectSession>((resolve, reject) => {
      unsubscribeState = options.subscribeModalState((open) => {
        if (open) {
          seenOpen = true;
          return;
        }
        if (!seenOpen) return;
        const current = options.getSession();
        if (hasSolanaAccount(current)) {
          finish(() => resolve(current));
          return;
        }
        finish(() => reject(new QRCodeModalError()));
      }) ?? undefined;

      if (options.subscribeDisplayUri && options.onDisplayUri) {
        const onDisplayUri = options.onDisplayUri;
        unsubscribeUri = options.subscribeDisplayUri((uri) => onDisplayUri(uri)) ?? undefined;
      }

      pollId = setInterval(() => {
        const current = options.getSession();
        if (hasSolanaAccount(current)) finish(() => resolve(current));
      }, options.pollIntervalMs ?? SOLANA_WC_SESSION_POLL_MS);

      void options.connectProvider()
        .then((connected) => {
          if (hasSolanaAccount(connected)) {
            finish(() => resolve(connected));
            return;
          }
          const current = options.getSession();
          if (hasSolanaAccount(current)) finish(() => resolve(current));
        })
        .catch((error: unknown) => {
          const current = options.getSession();
          if (hasSolanaAccount(current)) {
            finish(() => resolve(current));
            return;
          }
          finish(() => reject(error));
        });

      options.openModal();
    });
    options.closeModal();
    return session;
  } catch (error) {
    options.closeModal();
    const current = options.getSession();
    if (hasSolanaAccount(current)) return current;
    throw error;
  } finally {
    unsubscribeState?.();
    unsubscribeUri?.();
    if (pollId !== undefined) clearInterval(pollId);
  }
}
