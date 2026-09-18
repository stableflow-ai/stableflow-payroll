import {
  WalletError,
  WalletSendTransactionError,
  WalletSignMessageError,
  WalletSignTransactionError,
} from "@solana/wallet-adapter-base";
import { WALLET_CONNECTION_REJECTED_MESSAGE } from "../config";
import { isWalletConnectionRejected } from "../connect-feedback";
import {
  LEDGER_DEVICE_LOCKED_CODE,
  LEDGER_DEVICE_LOCKED_MESSAGE,
  LEDGER_LIVE_WC_DEEPLINK_IFRAME_MS,
  LEDGER_LIVE_WC_DEEPLINK_PREFIX,
} from "./config";
import { LedgerConnectCancelledError } from "./ledger-choice";

const LEDGER_LOCKED_PATTERN = new RegExp(
  `${LEDGER_DEVICE_LOCKED_CODE}|locked device`,
  "i",
);

type ConnectToast = {
  fail: (params: { title: string }) => void;
};

export function errorText(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string") return message;
  }
  return String(error ?? "");
}

export function isLedgerDeviceLocked(error: unknown): boolean {
  return LEDGER_LOCKED_PATTERN.test(errorText(error));
}

export function solanaWalletErrorMessage(error: unknown): string | null {
  if (isLedgerDeviceLocked(error)) return LEDGER_DEVICE_LOCKED_MESSAGE;
  return null;
}

export function openLedgerLiveWalletConnect(uri: string) {
  const url = `${LEDGER_LIVE_WC_DEEPLINK_PREFIX}${encodeURIComponent(uri)}`;
  const opened = window.open(url);
  if (opened != null) return;
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = url;
  document.body.appendChild(iframe);
  window.setTimeout(() => {
    iframe.remove();
  }, LEDGER_LIVE_WC_DEEPLINK_IFRAME_MS);
}

function isSolanaSignOrSendError(error: unknown): boolean {
  return (
    error instanceof WalletSignTransactionError
    || error instanceof WalletSendTransactionError
    || error instanceof WalletSignMessageError
  );
}

export function reportSolanaWalletError(toast: ConnectToast, error: unknown): void {
  if (error instanceof LedgerConnectCancelledError) return;
  const locked = solanaWalletErrorMessage(error);
  if (locked) {
    toast.fail({ title: locked });
    return;
  }
  // Sign / send failures are toasted by the payment mutation. This handler is
  // only for connect-time adapter errors; otherwise a rejected tx shows twice.
  if (isSolanaSignOrSendError(error)) return;
  if (isWalletConnectionRejected(error)) {
    toast.fail({ title: WALLET_CONNECTION_REJECTED_MESSAGE });
    return;
  }
  if (error instanceof WalletError) {
    toast.fail({ title: error.message || "Solana wallet error" });
  }
}
