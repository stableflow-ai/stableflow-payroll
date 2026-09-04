export const BONUS_CREATE_PATH = "/pay/batch";
export const BONUS_HISTORY_PATH = "/pay/history";

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

export const BONUS_PAY_DATE = {
  NextMonth1st: "next-month-1st",
} as const;

export type BonusPayDate =
  (typeof BONUS_PAY_DATE)[keyof typeof BONUS_PAY_DATE];

export const BONUS_PAY_DATE_OPTIONS = [
  { value: BONUS_PAY_DATE.NextMonth1st, label: "Every next month 1st" },
] as const;

export const BONUS_FORM_MAX_ROWS = 50;
export const BONUS_FORM_AMOUNT_MAX_DECIMALS = 6;
export const BONUS_FORM_COLUMNS =
  "minmax(110px,126px) minmax(180px,1fr) minmax(160px,184px) 99px 16px";

export const BONUS_TAB = {
  ToBePaid: "to_be_paid",
  History: "history",
} as const;

export type BonusTab = (typeof BONUS_TAB)[keyof typeof BONUS_TAB];

export const BONUS_MOCK_VARIANT = {
  Empty: "empty",
  Filled: "filled",
} as const;

export type BonusMockVariant =
  (typeof BONUS_MOCK_VARIANT)[keyof typeof BONUS_MOCK_VARIANT];

export const BONUS_CHART_RANGE = {
  Months6: "6m",
} as const;

export type BonusChartRange =
  (typeof BONUS_CHART_RANGE)[keyof typeof BONUS_CHART_RANGE];

export const BONUS_CHART_RANGE_OPTIONS = [
  { value: BONUS_CHART_RANGE.Months6, label: "Last 6 months" },
] as const;

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

export const BONUS_PAY_NOW_FORM_ID = {
  "bonus-team-a": "form-2026-bonus-team-a",
  "bonus-team-b": "form-2026-bonus-team-b",
} as const;

export const BONUS_CHART_LINE_COLOR = "#6284F5";
export const BONUS_CHART_HIGHLIGHT_COLOR = "#3F8AFB";
export const BONUS_CHART_Y_MAX = 600;

export const BONUS_CHANGE_UP_CLASS = "text-[#0ED000]";
export const BONUS_STATUS_FAILED_CLASS = "text-[#E43222]";
export const BONUS_STATUS_PAID_CLASS = "text-[#84A20F]";

export const PENDING_BONUS_TABLE_COLUMNS =
  "minmax(160px,1.4fr) minmax(88px,0.7fr) minmax(100px,0.9fr) minmax(140px,1.1fr) minmax(120px,0.9fr)";

export const IMPORT_CSV_TEMPLATE_FILENAME = "bonus-import-template.csv";
export const IMPORT_CSV_TEMPLATE = [
  "recipient,amount,token,network,memo",
  "0x557be3f47a45499385f60cd64e2ff455e42a3311,100,USDC,eth,bonus",
  "stableflow.near,50,USDT,near,",
  "9JXR51yBLBgfesHF8SJgKWkNnx4FxtJCxCc3AV31TBsn,25,USDC,sol,bonus",
  "TJbLVQHYf61a36iC7oyxdMiNSoqTMKYAMv,1,USDT,tron",
].join("\n");
