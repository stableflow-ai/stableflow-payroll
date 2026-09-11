import { BONUS_IMPORT_LIMITS, BONUS_TOTAL_PAYOUT_PERIOD } from "@/types/bonus";

export const BONUS_PATH = "/pay/bonus";
export const BONUS_HISTORY_PATH = "/pay/bonus/history";

export const BONUS_DRAWER_MODE = {
  Add: "add",
  Edit: "edit",
} as const;

export type BonusDrawerMode =
  (typeof BONUS_DRAWER_MODE)[keyof typeof BONUS_DRAWER_MODE];

export const BONUS_DRAWER_TITLE = {
  [BONUS_DRAWER_MODE.Add]: "Add Bonus",
  [BONUS_DRAWER_MODE.Edit]: "Edit Bonus",
} as const;

export const BONUS_FORM_MAX_ROWS = 500;
export const BONUS_FORM_AMOUNT_MAX_DECIMALS = 6;
export const BONUS_FORM_TITLE_MAX = BONUS_IMPORT_LIMITS.title;
export const BONUS_FORM_COLUMNS =
  "minmax(110px,126px) minmax(0,1fr) minmax(140px,180px) 184px 99px 38px";
export const BONUS_FORM_DESKTOP_QUERY = "(min-width: 768px)";

export const BONUS_TAB = {
  ToBePaid: "to_be_paid",
  History: "history",
} as const;

export type BonusTab = (typeof BONUS_TAB)[keyof typeof BONUS_TAB];

export const BONUS_CHART_RANGE = BONUS_TOTAL_PAYOUT_PERIOD;

export type BonusChartRange =
  (typeof BONUS_CHART_RANGE)[keyof typeof BONUS_CHART_RANGE];

export const BONUS_CHART_RANGE_OPTIONS = [
  { value: BONUS_CHART_RANGE.Day, label: "Daily" },
  { value: BONUS_CHART_RANGE.Week, label: "Weekly" },
  { value: BONUS_CHART_RANGE.Month, label: "Monthly" },
] as const;

export const BONUS_RECENT_PAGE_SIZE = 10;
export const BONUS_RECENT_LIMIT_MAX = 100;
export const RECENT_PAYOUTS_POLL_MS = 30_000;
export const BONUS_HISTORY_PAGE_SIZE = 10;

export const BONUS_PAYOUT_STATUS = {
  Pending: "pending",
  Failed: "failed",
  Paid: "paid",
} as const;

export type BonusPayoutStatus =
  (typeof BONUS_PAYOUT_STATUS)[keyof typeof BONUS_PAYOUT_STATUS];

export const BONUS_ROW_ACTION = {
  Paying: "paying",
  PayNow: "pay_now",
} as const;

export type BonusRowAction =
  (typeof BONUS_ROW_ACTION)[keyof typeof BONUS_ROW_ACTION];

export const BONUS_CHART_LINE_COLOR = "#6284F5";
export const BONUS_CHART_HIGHLIGHT_COLOR = "#3F8AFB";

export const BONUS_CHANGE_UP_CLASS = "text-[#0ED000]";
export const BONUS_CHANGE_DOWN_CLASS = "text-[#E43222]";
export const BONUS_STATUS_FAILED_CLASS = "text-[#E43222]";
export const BONUS_STATUS_PAID_CLASS = "text-[#84A20F]";

export const PENDING_BONUS_TABLE_COLUMNS =
  "minmax(140px,1.2fr) minmax(88px,0.7fr) minmax(120px,1fr) minmax(160px,1.4fr) minmax(160px,1.3fr) minmax(140px,1.1fr) minmax(140px,1fr) minmax(120px,0.9fr)";

export const IMPORT_CSV_ACCEPT = ".csv,text/csv";
export const IMPORT_CSV_TEMPLATE_FILENAME = "bonus-import-template.csv";
export const IMPORT_CSV_TEMPLATE = [
  "recipient,email,amount,token,network,memo",
  "0x557be3f47a45499385f60cd64e2ff455e42a3311,alice@example.com,100,USDC,eth,bonus",
  "stableflow.near,bob@example.com,50,USDT,near,",
  "9JXR51yBLBgfesHF8SJgKWkNnx4FxtJCxCc3AV31TBsn,carol@example.com,25,USDC,sol,bonus",
  "TJbLVQHYf61a36iC7oyxdMiNSoqTMKYAMv,dave@example.com,1,USDT,tron"
].join("\n");
