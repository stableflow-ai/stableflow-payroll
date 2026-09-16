import { WALLET_CONNECTION_REJECTED_CODE, WALLET_CONNECTION_REJECTED_MESSAGE } from "./config";

const REJECTED_PATTERN =
  /user rejected|user denied|rejected the request|user closed modal|connection rejected|cancelled|canceled|failed to sign in|wallet closed/i;

type ConnectToast = {
  fail: (params: { title: string }) => void;
};

function errorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string") return message;
  }
  return String(error ?? "");
}

function isUserRejectedCode(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("code" in error)) return false;
  const code = (error as { code: unknown }).code;
  return code === WALLET_CONNECTION_REJECTED_CODE || code === String(WALLET_CONNECTION_REJECTED_CODE);
}

export function isWalletConnectionRejected(error: unknown): boolean {
  if (isUserRejectedCode(error)) return true;
  if (error && typeof error === "object" && "error" in error) {
    const nested = (error as { error: unknown }).error;
    if (nested && nested !== error && isWalletConnectionRejected(nested)) return true;
  }
  return REJECTED_PATTERN.test(errorMessage(error));
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
