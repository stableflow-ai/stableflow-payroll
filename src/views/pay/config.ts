import type { ComponentType } from "react";
import { IconBatchUp, IconDuration, IconRecords, IconUp } from "@/components/icons";
import type { IconProps } from "@/components/icons/types";
import { PAYOUT_SYMBOLS } from "@/stores/intents-tokens";

export const PAY_NAV_GROUP = {
  Payout: "payout",
  Request: "request",
} as const;

export const PAY_NAV_ITEMS = [
  { label: "Single Payout", to: "/pay", icon: IconUp, iconClassName: undefined, group: PAY_NAV_GROUP.Payout },
  { label: "Batch Payout", to: "/pay/batch", icon: IconBatchUp, iconClassName: undefined, group: PAY_NAV_GROUP.Payout },
  { label: "Pending Payouts", to: "/pay/pending", icon: IconDuration, iconClassName: undefined, group: PAY_NAV_GROUP.Payout },
  { label: "Transaction History", to: "/pay/history", icon: IconRecords, iconClassName: undefined, group: PAY_NAV_GROUP.Payout },
  // { label: "Request Payment", to: "/pay/request", icon: IconUp, iconClassName: "rotate-180", group: PAY_NAV_GROUP.Request },
] as const satisfies ReadonlyArray<{
  label: string;
  to: string;
  icon: ComponentType<IconProps>;
  iconClassName: string | undefined;
  group: (typeof PAY_NAV_GROUP)[keyof typeof PAY_NAV_GROUP];
}>;

/** Hosted-checkout return page. Sent as `success_url` when creating a payment. */
export const PAYOUT_RESULT_PATH = "/pay/result";

/**
 * Status values seen on the result page. `success` comes from the hosted
 * checkout callback, `completed` from `GET /v1/payroll/payments/{payment_id}`.
 */
export const PAYOUT_RESULT_STATUS = {
  Success: "success",
  Completed: "completed",
} as const;

/** Titles for Pay routes that are not in the sidebar. */
export const PAY_ROUTE_TITLES: Record<string, string> = {
  [PAYOUT_RESULT_PATH]: "Payment Result",
};

export const PAYOUT_TABLE_COLUMNS =
  "minmax(150px,1.3fr) minmax(72px,0.5fr) minmax(140px,1fr) minmax(130px,1fr) minmax(150px,1fr) minmax(150px,0.95fr)";
export const RECEIVED_PAYMENT_TABLE_COLUMNS =
  "minmax(160px,1.2fr) minmax(150px,1.1fr) minmax(148px,0.95fr) minmax(148px,0.95fr) minmax(130px,0.9fr) minmax(118px,0.85fr) minmax(72px,0.45fr)";
export const HISTORY_PAGE_SIZE = 10;
export const EXPORT_FILENAME_STAMP = "yyyyMMdd-HHmmss";
export const HISTORY_STATUS_FILTER = {
  All: "all",
  Complete: "completed",
  Failed: "failed",
} as const;

export const HISTORY_ASSET_FILTER = {
  All: "all",
  ...Object.fromEntries(PAYOUT_SYMBOLS.map((symbol) => [symbol, symbol])),
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
export const PAYMENT_NAME_MAX_LENGTH = 50;
export const PAYMENT_NAME_ELLIPSIS_PREFIX = 8;
export const PAYMENT_NAME_ELLIPSIS_SUFFIX = 8;

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

export const IMPORT_MAX_ROWS = 50;
export const IMPORT_CSV_ACCEPT = ".csv,text/csv";
export const IMPORT_CSV_TEMPLATE_FILENAME = "payout-import-template.csv";
export const IMPORT_CSV_TEMPLATE = [
  "recipient,amount,token,network,memo",
  "0x557be3f47a45499385f60cd64e2ff455e42a3311,100,USDC,eth,payroll",
  "stableflow.near,50,USDT,near,",
  "9JXR51yBLBgfesHF8SJgKWkNnx4FxtJCxCc3AV31TBsn,25,USDC,sol,bonus",
  "TJbLVQHYf61a36iC7oyxdMiNSoqTMKYAMv,1,USDT,tron",
].join("\n");
