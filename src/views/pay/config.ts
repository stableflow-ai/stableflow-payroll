import type { ComponentType } from "react";
import { IconBatchUp, IconDuration, IconRecords, IconUp } from "@/components/icons";
import type { IconProps } from "@/components/icons/types";

export const PAY_NAV_ITEMS = [
  { label: "Single Payout", to: "/pay", icon: IconUp, iconClassName: undefined },
  { label: "Batch Payout", to: "/pay/batch", icon: IconBatchUp, iconClassName: undefined },
  { label: "Request Payment", to: "/pay/request", icon: IconUp, iconClassName: "rotate-180" },
  { label: "Pending Payouts", to: "/pay/pending", icon: IconDuration, iconClassName: undefined },
  { label: "Transaction History", to: "/pay/history", icon: IconRecords, iconClassName: undefined },
] as const satisfies ReadonlyArray<{
  label: string;
  to: string;
  icon: ComponentType<IconProps>;
  iconClassName: string | undefined;
}>;

export const AMOUNT_MAX_DECIMALS = 6;
export const QUOTE_DEBOUNCE_MS = 900;
export const QUICK_PAY_SLIPPAGE_TOLERANCE = 5;
export const ORIGIN_BALANCE_POLL_MS = 20_000;
export const MEMO_MAX_LENGTH = 200;
export const CONTACT_NAME_MAX_LENGTH = 50;
export const EMAIL_MAX_LENGTH = 50;
export const PRIVATE_BY_DEFAULT_LABEL = "Private by default";
export const MEMO_TOOLTIP = "The memo will be displayed in the history, visible only to you";

export const QUICK_PAY_TOAST = {
  INSUFFICIENT_BALANCE: "Insufficient balance",
  COULD_NOT_READ_BALANCE: "Could not read wallet balance",
  UNSUPPORTED_ORIGIN_CHAIN: "Quick Pay currently supports EVM origin tokens only",
  PAYMENT_SUBMITTED: "Payment submitted",
} as const;

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const IMPORT_MAX_ROWS = 500;
export const IMPORT_CSV_ACCEPT = ".csv,text/csv";
export const IMPORT_CSV_TEMPLATE_FILENAME = "payout-import-template.csv";
export const IMPORT_CSV_TEMPLATE = [
  "recipient,amount,token,network,memo",
  "0x1111111111111111111111111111111111111111,100,USDC,ethereum,payroll",
  "alice.near,50,USDT,near,",
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA,25,USDC,solana,bonus",
].join("\n");

export const IMPORT_TOAST = {
  MAX_ROWS: `Imported the first ${IMPORT_MAX_ROWS} rows`,
  EMPTY: "No rows found",
  PARSE_FAILED: "Could not parse the file",
  CSV_TYPE: "Please upload a CSV file",
  GOOGLE_NOT_CONFIGURED: "Google Sheets import is not configured",
  GOOGLE_FAILED: "Could not read Google Sheet",
} as const;

export const BATCH_PAY_TOAST = {
  INSUFFICIENT_BALANCE: "Insufficient balance",
  COULD_NOT_READ_BALANCE: "Could not read wallet balance",
  UNSUPPORTED_ORIGIN_CHAIN: "Batch payout currently supports EVM origin tokens only",
  PAYMENT_SUBMITTED: "Payment submitted",
  SELECT_PAYING_TOKEN: "Select a paying token",
} as const;

export const BATCH_LIQUIDITY_HINT =
  "Batch quotes may lack liquidity for large totals; some recipients might fail.";

export const BATCH_COPY = {
  UPLOAD_TITLE: "Upload a CSV File",
  UPLOAD_HINT: "Privately execute payments from your organization's treasury.",
  DROP: "Drop CSV file here",
  CHOOSE_FILE: "Choose file",
  ENTER_MANUALLY: "Enter Manually",
  DOWNLOAD_TEMPLATE: "Download Template",
  VALIDATE_TITLE: "Validate",
  VALIDATE_HINT: "Send a private payment from your organization's treasury.",
  PAYING_TOKEN: "Paying Token & Network",
  RECIPIENT: "Recipient",
  AMOUNT: "Amount",
  PREFER_TOKEN: "Prefer Token, Network",
  MEMO: "Memo",
  ADD_ONE: "Add one",
  TOTAL_AMOUNT: "Total Amount:",
  PREVIEW_TITLE: "Preview & Confirm",
  PREVIEW_HINT: "Send a private payment from your organization's treasury.",
  TOTAL_VALUED: "Total Valued",
  TOKEN_BREAKDOWN: "Token Breakdown",
  TOTAL_PAYOUTS: "Total Payouts",
  PAY_FROM: "Pay from",
  PAYING_TOKEN_LABEL: "Paying Token",
  TOTAL_FEES: "Total Fees",
  TOTAL_COST: "Total Cost",
  CONFIRM_SEND: "Confirm & Send",
  BACK: "Back",
  CONTINUE: "Continue",
  SELECT_SHEET: "Select a sheet",
  INPUT_AMOUNT: "Input amount",
  STEP_VALIDATE: "Validate",
  STEP_PREVIEW: "Preview & Confirm",
} as const;
