export const TRON_APP_NAME = "Stableflow Pay";

export const TRON_FEE_LIMIT_SUN = 150_000_000;
export const TRON_CONFIRM_MAX_RETRIES = 60;
export const TRON_CONFIRM_RETRY_DELAY_MS = 2000;
export const TRON_CONFIRM_TIMEOUT_MESSAGE = "Tron transaction confirmation timed out";
export const TRON_TX_FAILED_PREFIX = "Tron transaction failed: ";

export const TRON_WALLETCONNECT_ADAPTER_NAME = "WalletConnect";
export const TRON_LEDGER_ADAPTER_NAME = "Ledger";

export const LEDGER_DEVICE_LOCKED_CODE = "0x5515";
export const LEDGER_DEVICE_LOCKED_MESSAGE =
  "Unlock your Ledger device and open the Tron app.";

export const LEDGER_CONNECT_DIALOG_TITLE = "Connect Ledger";
export const LEDGER_CONNECT_DIALOG_DESCRIPTION =
  "Before continuing, please ensure the TRON app is installed on your Ledger device. You may install it via Ledger Live.";
export const LEDGER_CONNECT_USB_LABEL = "USB";
export const LEDGER_CONNECT_RETRY_LABEL = "Retry";
export const LEDGER_CONNECT_USB_FAILED_MESSAGE = "Could not connect Ledger over USB.";
export const LEDGER_CONNECT_DIALOG_DELAY_MS = 200;
