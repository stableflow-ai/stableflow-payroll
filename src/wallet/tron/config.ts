export const TRON_APP_NAME = "Stableflow Payouts";

export const TRON_FEE_LIMIT_SUN = 150_000_000;
export const TRON_TX_EXPIRATION_MS = 10 * 60 * 1000;
export const TRON_CONFIRM_MAX_RETRIES = 60;
export const TRON_CONFIRM_RETRY_DELAY_MS = 2000;
export const TRON_CONFIRM_TIMEOUT_MESSAGE = "Tron transaction confirmation timed out";
export const TRON_TX_FAILED_PREFIX = "Tron transaction failed: ";
export const TRON_BROADCAST_FAILED_PREFIX = "Tron broadcast failed: ";
export const TRON_BROADCAST_EXPIRED_MESSAGE =
  "Tron transaction expired before broadcast. Click Send Payment to try again.";

export const TRON_WALLETCONNECT_ADAPTER_NAME = "WalletConnect";
export const TRON_LEDGER_ADAPTER_NAME = "Ledger";

export const LEDGER_DEVICE_LOCKED_CODE = "0x5515";
export const LEDGER_DEVICE_LOCKED_PATTERN = "0x5515|0x6a83|locked device";
export const LEDGER_DEVICE_LOCKED_MESSAGE =
  "Unlock your Ledger device and open the Tron app.";
export const LEDGER_WRONG_APP_CODE = "0x6511";
export const LEDGER_WRONG_APP_MESSAGE =
  "Open the Tron app on your Ledger and wait until it says Application is ready, then retry.";
export const LEDGER_TX_DATA_CODE = "0x6a8b";
export const LEDGER_TX_DATA_MESSAGE =
  'Ledger rejected this transaction. Turn on "Transactions data" in the Tron app settings on your Ledger, then send the payment again.';
export const LEDGER_BLIND_SIGN_CODE = "0x6a8c";
export const LEDGER_BLIND_SIGN_MESSAGE =
  'Ledger rejected this contract call. Turn on "Blind signing" in the Tron app settings on your Ledger, then send the payment again.';
export const LEDGER_CUSTOM_CONTRACT_CODE = "0x6a8d";
export const LEDGER_CUSTOM_CONTRACT_MESSAGE =
  'Ledger rejected this contract call. Turn on "Custom contracts" in the Tron app settings on your Ledger, then send the payment again.';

/** hw-app-trx sends one protobuf field per APDU and refuses fields above this. */
export const TRON_LEDGER_SIGN_CHUNK_LIMIT = 250;

export const LEDGER_BLIND_SIGN_DIALOG_TITLE = "Turn on Blind signing";
export const LEDGER_BLIND_SIGN_DIALOG_DESCRIPTION =
  "A batch payment is too large for your Ledger to display, so it is signed by transaction hash. On your Ledger, open the Tron app, go to Settings, and turn on Blind signing. Without it the payment fails after the approval is already on-chain.";
export const LEDGER_BLIND_SIGN_CONFIRM_LABEL = "I have turned it on";
export const LEDGER_BLIND_SIGN_CANCEL_LABEL = "Cancel";
export const LEDGER_SIGN_GAP_MS = 400;

export const LEDGER_CONNECT_DIALOG_TITLE = "Connect Ledger";
export const LEDGER_CONNECT_DIALOG_DESCRIPTION =
  "Before continuing, please ensure the TRON app is installed on your Ledger device. You may install it via Ledger Live.";
export const LEDGER_CONNECT_USB_LABEL = "USB";
export const LEDGER_CONNECT_RETRY_LABEL = "Retry";
export const LEDGER_CONNECT_USB_FAILED_MESSAGE = "Could not connect Ledger over USB.";
export const LEDGER_CONNECT_DIALOG_DELAY_MS = 200;
