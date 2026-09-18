export const PHANTOM_SIGN_DISPLAY = "utf8";

export const SOLANA_EXPIRED_MESSAGE = "Solana transaction expired. Confirm again to retry.";
export const SOLANA_TRANSFER_FAILED_MESSAGE = "Solana transfer failed";
export const SOLANA_MISSING_OUTPUTS_MESSAGE = "Missing Solana deposit outputs";
export const SOLANA_OUTPUT_AMOUNT_MISMATCH_MESSAGE =
  "Solana deposit outputs do not match the quoted source amount";
export const SOLANA_ATA_ALLOW_OWNER_OFF_CURVE = true;
export const SOLANA_REBROADCAST_INTERVAL_MS = 2_000;
export const SOLANA_REBROADCAST_MAX_DURATION_MS = 60_000;

export const LEDGER_DEVICE_LOCKED_CODE = "0x5515";
export const LEDGER_DEVICE_LOCKED_MESSAGE =
  "Unlock your Ledger device and open the Solana app.";

export const LEDGER_CONNECT_DIALOG_TITLE = "Connect Ledger";
export const LEDGER_CONNECT_DIALOG_DESCRIPTION =
  "Before continuing, please ensure the SOLANA app is installed on your Ledger device. You may install it via Ledger Live.";
export const LEDGER_CONNECT_USB_LABEL = "USB";
export const LEDGER_CONNECT_LIVE_LABEL = "Ledger Live";
export const LEDGER_CONNECT_CLOSE_LABEL = "Close";
export const LEDGER_CONNECT_USB_FAILED_MESSAGE = "Could not connect Ledger over USB.";
export const LEDGER_CONNECT_DIALOG_DELAY_MS = 200;

export const LEDGER_LIVE_WC_DEEPLINK_PREFIX = "ledgerlive://wc?uri=";
export const LEDGER_LIVE_WC_DEEPLINK_IFRAME_MS = 1_000;

export const SOLANA_WC_SESSION_POLL_MS = 250;
export const SOLANA_WC_SILENT_SESSION_TIMEOUT_MS = 2_000;
export const SOLANA_WC_MAINNET_CHAIN = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";
export const SOLANA_WC_DEPRECATED_MAINNET_CHAIN = "solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ";
