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

export const PAYOUT_TABLE_COLUMNS =
  "minmax(150px,1.3fr) minmax(72px,0.5fr) minmax(140px,1fr) minmax(130px,1fr) minmax(150px,1fr) minmax(150px,0.95fr)";
export const RECEIVED_PAYMENT_TABLE_COLUMNS =
  "minmax(180px,1.5fr) minmax(130px,0.9fr) minmax(130px,0.9fr) minmax(110px,0.7fr) minmax(64px,0.45fr)";
export const HISTORY_PAGE_SIZE = 10;
export const EXPORT_FILENAME_STAMP = "yyyyMMdd-HHmmss";
export const HISTORY_STATUS_FILTER = {
  All: "all",
  Complete: "completed",
  Failed: "failed",
} as const;
export const HISTORY_ASSET_FILTER = {
  All: "all",
  USDT: "USDT",
  USDC: "USDC",
} as const;

export const AMOUNT_MAX_DECIMALS = 6;
export const QUOTE_DEBOUNCE_MS = 900;
export const QUICK_PAY_SLIPPAGE_TOLERANCE = 5;
export const ORIGIN_BALANCE_POLL_MS = 20_000;
export const MEMO_MAX_LENGTH = 200;
export const CONTACT_NAME_MAX_LENGTH = 50;
export const EMAIL_MAX_LENGTH = 50;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const DESCRIPTION_MAX_LENGTH = 200;
export const DESCRIPTION_MAX_ROWS = 3;

export const PAYMENT_REQUEST_QUERY = {
  Id: "id",
} as const;

export const PAY_REQUEST_STATUS = {
  Pending: "pending",
  Submitted: "submitted",
  Completed: "completed",
  Withdrawing: "withdrawing",
  Withdrawed: "withdrawed",
  Failed: "failed",
} as const;

export const PAY_REQUEST_MODE = {
  Standard: "standard",
  Private: "private",
} as const;

export const REQUEST_LIST_REFRESH_MS = 30_000;
export const REQUEST_WITHDRAW_COUNT_POLL_MS = 120_000;

export const IMPORT_MAX_ROWS = 500;
export const IMPORT_CSV_ACCEPT = ".csv,text/csv";
export const IMPORT_CSV_TEMPLATE_FILENAME = "payout-import-template.csv";
export const IMPORT_CSV_TEMPLATE = [
  "recipient,amount,token,network,memo",
  "0x1111111111111111111111111111111111111111,100,USDC,ethereum,payroll",
  "alice.near,50,USDT,near,",
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA,25,USDC,solana,bonus",
].join("\n");
