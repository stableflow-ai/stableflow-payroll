import { AdapterState } from "@tronweb3/tronwallet-abstract-adapter";
import type { Wallet } from "@tronweb3/tronwallet-adapter-react-hooks";
import { isWalletConnectionRejected, reportWalletConnectError } from "../connect-feedback";
import {
  LEDGER_BLIND_SIGN_CODE,
  LEDGER_BLIND_SIGN_MESSAGE,
  LEDGER_CUSTOM_CONTRACT_CODE,
  LEDGER_CUSTOM_CONTRACT_MESSAGE,
  LEDGER_TX_DATA_CODE,
  LEDGER_TX_DATA_MESSAGE,
  TRON_LEDGER_ADAPTER_NAME,
  TRON_WALLETCONNECT_ADAPTER_NAME,
} from "./config";
import {
  isLedgerConnectDialogOpen,
  LedgerConnectCancelledError,
} from "./ledger-choice";

const ALWAYS_VISIBLE = new Set([TRON_WALLETCONNECT_ADAPTER_NAME, TRON_LEDGER_ADAPTER_NAME]);

const SIGN_ERROR_NAMES = new Set([
  "WalletSignTransactionError",
  "WalletSignMessageError",
  "WalletSendTransactionError",
]);

type ConnectToast = {
  fail: (params: { title: string }) => void;
};

function errorName(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  if ("name" in error && typeof error.name === "string") return error.name;
  if ("constructor" in error && error.constructor && typeof error.constructor.name === "string") {
    return error.constructor.name;
  }
  return "";
}

export function isTronSignOrSendError(error: unknown): boolean {
  return SIGN_ERROR_NAMES.has(errorName(error));
}

export function tronWalletErrorMessage(error: unknown): string | null {
  const text = error instanceof Error ? error.message : String(error ?? "");
  if (new RegExp(LEDGER_BLIND_SIGN_CODE, "i").test(text)) return LEDGER_BLIND_SIGN_MESSAGE;
  if (new RegExp(LEDGER_CUSTOM_CONTRACT_CODE, "i").test(text)) return LEDGER_CUSTOM_CONTRACT_MESSAGE;
  if (new RegExp(LEDGER_TX_DATA_CODE, "i").test(text)) return LEDGER_TX_DATA_MESSAGE;
  return null;
}

export function reportTronWalletError(
  toast: ConnectToast,
  error: unknown,
  deselect: () => void,
): void {
  if (error instanceof LedgerConnectCancelledError) {
    deselect();
    return;
  }
  // Sign / send failures are toasted by the payment mutation.
  if (isTronSignOrSendError(error)) return;
  if (isLedgerConnectDialogOpen()) return;
  reportWalletConnectError(toast, error);
  if (isWalletConnectionRejected(error)) deselect();
}

export function visibleTronWallets(wallets: Wallet[]): Wallet[] {
  const detected = wallets.filter(
    (wallet) =>
      (wallet.state !== AdapterState.NotFound && wallet.state !== AdapterState.Loading)
      || ALWAYS_VISIBLE.has(wallet.adapter.name),
  );
  if (detected.length > 0) return detected;
  return wallets.filter((wallet) => ALWAYS_VISIBLE.has(wallet.adapter.name));
}
