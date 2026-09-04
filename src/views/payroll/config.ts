export const PAYROLL_CREATE_PATH = "/pay/batch";
export const PAYROLL_HISTORY_PATH = "/pay/history";

export const PAYROLL_DRAWER_MODE = {
  Add: "add",
  Edit: "edit",
} as const;

export type PayrollDrawerMode =
  (typeof PAYROLL_DRAWER_MODE)[keyof typeof PAYROLL_DRAWER_MODE];

export const PAYROLL_DRAWER_TITLE = {
  [PAYROLL_DRAWER_MODE.Add]: "Add Payroll",
  [PAYROLL_DRAWER_MODE.Edit]: "Edit Payroll",
} as const;

export const PAYROLL_PAY_DATE = {
  NextMonth1st: "next-month-1st",
} as const;

export type PayrollPayDate =
  (typeof PAYROLL_PAY_DATE)[keyof typeof PAYROLL_PAY_DATE];

export const PAYROLL_PAY_DATE_OPTIONS = [
  { value: PAYROLL_PAY_DATE.NextMonth1st, label: "Every next month 1st" },
] as const;

export const PAYROLL_FORM_MAX_ROWS = 50;
export const PAYROLL_FORM_AMOUNT_MAX_DECIMALS = 6;
export const PAYROLL_FORM_COLUMNS =
  "minmax(110px,126px) minmax(180px,1fr) minmax(160px,184px) 99px 16px";

export const PAYROLL_TAB = {
  Next: "next",
  History: "history",
} as const;

export type PayrollTab = (typeof PAYROLL_TAB)[keyof typeof PAYROLL_TAB];

export const PAYROLL_MOCK_VARIANT = {
  Empty: "empty",
  Filled: "filled",
} as const;

export type PayrollMockVariant =
  (typeof PAYROLL_MOCK_VARIANT)[keyof typeof PAYROLL_MOCK_VARIANT];

export const PAYROLL_CHART_RANGE = {
  Months6: "6m",
} as const;

export type PayrollChartRange =
  (typeof PAYROLL_CHART_RANGE)[keyof typeof PAYROLL_CHART_RANGE];

export const PAYROLL_CHART_RANGE_OPTIONS = [
  { value: PAYROLL_CHART_RANGE.Months6, label: "Last 6 months" },
] as const;

export const PAYROLL_PAYOUT_STATUS = {
  Pending: "pending",
  Failed: "failed",
  Paid: "paid",
} as const;

export type PayrollPayoutStatus =
  (typeof PAYROLL_PAYOUT_STATUS)[keyof typeof PAYROLL_PAYOUT_STATUS];

export const PAYROLL_RUN_STATUS = {
  Pending: "pending",
  Failed: "failed",
  Paid: "paid",
} as const;

export type PayrollRunStatus =
  (typeof PAYROLL_RUN_STATUS)[keyof typeof PAYROLL_RUN_STATUS];

export const PAYROLL_CHART_LINE_COLOR = "#6284F5";
export const PAYROLL_CHART_HIGHLIGHT_COLOR = "#3F8AFB";
export const PAYROLL_CHART_Y_MAX = 40_000;

export const PAYROLL_CHANGE_UP_CLASS = "text-[#0ED000]";
export const PAYROLL_STATUS_PENDING_CLASS = "text-[#0066FF]";
export const PAYROLL_STATUS_FAILED_CLASS = "text-[#E43222]";
export const PAYROLL_STATUS_PAID_CLASS = "text-[#84A20F]";

export const NEXT_PAYROLL_TABLE_COLUMNS =
  "minmax(120px,1.2fr) minmax(140px,1.1fr) minmax(140px,1fr) minmax(80px,0.6fr) minmax(110px,0.7fr)";

export const IMPORT_CSV_ACCEPT = ".csv,text/csv";
export const IMPORT_CSV_TEMPLATE_FILENAME = "payroll-import-template.csv";
export const IMPORT_CSV_TEMPLATE = [
  "recipient,amount,token,network,memo",
  "0x557be3f47a45499385f60cd64e2ff455e42a3311,100,USDC,eth,payroll",
  "stableflow.near,50,USDT,near,",
  "9JXR51yBLBgfesHF8SJgKWkNnx4FxtJCxCc3AV31TBsn,25,USDC,sol,bonus",
  "TJbLVQHYf61a36iC7oyxdMiNSoqTMKYAMv,1,USDT,tron",
].join("\n");
