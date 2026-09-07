import { PAYABLE_TYPE, type PayableKey } from "@/types/payable";
import { PAYROLL_IMPORT_DAY_TYPE, PAYROLL_TOTAL_PAYOUT_PERIOD } from "@/types/payroll";

export const PAYROLL_CREATE_PATH = "/pay/batch";
export const PAYROLL_PAY_NOW_PAYABLE: PayableKey = {
  type: PAYABLE_TYPE.Payroll,
  periodMonth: "2026-09",
};

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

export const PAYROLL_PAY_DAY = {
  First: 1,
  Last: 31,
} as const;

export type PayrollPayDay = number;

export const PAYROLL_PAY_DATE_TYPE_OPTIONS = [
  { value: PAYROLL_IMPORT_DAY_TYPE.FirstDay, label: "First day of month" },
  { value: PAYROLL_IMPORT_DAY_TYPE.LastDay, label: "Last day of month" },
  { value: PAYROLL_IMPORT_DAY_TYPE.DayOfMonth, label: "Day of month" },
] as const;

export const PAYROLL_PAY_DAY_NUMBERS = Array.from(
  { length: PAYROLL_PAY_DAY.Last },
  (_, index) => index + 1,
);

function payrollDayOrdinal(day: number): string {
  const rem = day % 100;
  if (rem >= 11 && rem <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

export function payrollPayDayLabel(day: number): string {
  if (day === PAYROLL_PAY_DAY.Last) return "Every last day of month";
  return `Every next month ${payrollDayOrdinal(day)}`;
}

export const PAYROLL_FORM_MAX_ROWS = 50;
export const PAYROLL_FORM_AMOUNT_MAX_DECIMALS = 6;
export const PAYROLL_FORM_COLUMNS =
  "minmax(110px,126px) minmax(0,1fr) minmax(140px,180px) 184px 99px 38px";

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

export const PAYROLL_CHART_RANGE = PAYROLL_TOTAL_PAYOUT_PERIOD;

export type PayrollChartRange =
  (typeof PAYROLL_CHART_RANGE)[keyof typeof PAYROLL_CHART_RANGE];

export const PAYROLL_CHART_RANGE_OPTIONS = [
  { value: PAYROLL_CHART_RANGE.Day, label: "Daily" },
  { value: PAYROLL_CHART_RANGE.Week, label: "Weekly" },
  { value: PAYROLL_CHART_RANGE.Month, label: "Monthly" },
] as const;

export const PAYROLL_RECENT_PAGE_SIZE = 10;
export const PAYROLL_RECENT_LIMIT_MAX = 100;
export const PAYROLL_HISTORY_PAGE_SIZE = 10;

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
  "minmax(110px,1fr) minmax(130px,1.1fr) minmax(140px,1.1fr) minmax(130px,1fr) minmax(80px,0.6fr) minmax(110px,0.7fr)";

export const PAYROLL_HISTORY_DETAIL_DESKTOP_QUERY = "(min-width: 768px)";

export const PAYROLL_HISTORY_DETAIL_COLUMNS = [
  { key: "recipients", label: "Recipients" },
  { key: "address", label: "Address" },
  { key: "payoutPreference", label: "Payout Preference" },
  { key: "amount", label: "Amount" },
  { key: "netPay", label: "Net Pay" },
  { key: "status", label: "Status" },
] as const;

export const PAYROLL_HISTORY_DETAIL_GRID =
  "grid min-w-[760px] grid-cols-[1.3fr_1.2fr_1.1fr_0.7fr_0.7fr_0.9fr] items-center gap-x-3";

export const PAYROLL_HISTORY_DETAIL_PAID_CLASS = "text-[#769400]";
export const PAYROLL_HISTORY_DETAIL_FAILED_CLASS = "text-[#FF5353]";
export const PAYROLL_HISTORY_DETAIL_DELTA_UP_CLASS = "text-[#94ba00]";
export const PAYROLL_HISTORY_DETAIL_DELTA_DOWN_CLASS = "text-[#ff5353]";
export const PAYROLL_HISTORY_DETAIL_FAILED_COPY =
  "This payment transaction has failed";

export const IMPORT_CSV_ACCEPT = ".csv,text/csv";
export const IMPORT_CSV_TEMPLATE_FILENAME = "payroll-import-template.csv";
export const IMPORT_CSV_TEMPLATE = [
  "recipient,email,amount,token,network,memo",
  "0x557be3f47a45499385f60cd64e2ff455e42a3311,alice@example.com,100,USDC,eth,payroll",
  "stableflow.near,bob@example.com,50,USDT,near,",
  "9JXR51yBLBgfesHF8SJgKWkNnx4FxtJCxCc3AV31TBsn,carol@example.com,25,USDC,sol,bonus",
  "TJbLVQHYf61a36iC7oyxdMiNSoqTMKYAMv,dave@example.com,1,USDT,tron",
].join("\n");
