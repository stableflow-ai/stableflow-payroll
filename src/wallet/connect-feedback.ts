import { WALLET_CONNECTION_REJECTED_MESSAGE } from "./config";

const REJECTED_PATTERN = /user rejected|user denied|rejected the request|user closed modal|connection rejected/i;

type ConnectToast = {
  fail: (params: { title: string }) => void;
};

export function isWalletConnectionRejected(error: unknown): boolean {
  if (error && typeof error === "object" && "error" in error) {
    const nested = (error as { error: unknown }).error;
    if (nested && nested !== error && isWalletConnectionRejected(nested)) return true;
  }
  const message = error instanceof Error ? error.message : String(error ?? "");
  return REJECTED_PATTERN.test(message);
}

export function reportWalletConnectError(toast: ConnectToast, error: unknown): void {
  if (isWalletConnectionRejected(error)) {
    toast.fail({ title: WALLET_CONNECTION_REJECTED_MESSAGE });
  }
}

export async function withWalletConnectError<T>(
  toast: ConnectToast,
  task: () => Promise<T>,
): Promise<T> {
  try {
    return await task();
  } catch (error) {
    reportWalletConnectError(toast, error);
    throw error;
  }
}
