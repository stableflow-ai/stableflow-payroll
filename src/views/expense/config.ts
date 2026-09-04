export const EXPENSE_TAB = {
  Open: "open",
  History: "history",
} as const;

export type ExpenseTab =
  (typeof EXPENSE_TAB)[keyof typeof EXPENSE_TAB];

export const EXPENSE_CHART_RANGE = {
  Months6: "6m",
} as const;

export type ExpenseChartRange =
  (typeof EXPENSE_CHART_RANGE)[keyof typeof EXPENSE_CHART_RANGE];

export const EXPENSE_CHART_RANGE_OPTIONS = [
  { value: EXPENSE_CHART_RANGE.Months6, label: "Last 6 months" },
] as const;

export const EXPENSE_PAYOUT_STATUS = {
  Pending: "pending",
  Failed: "failed",
  Paid: "paid",
} as const;

export type ExpensePayoutStatus =
  (typeof EXPENSE_PAYOUT_STATUS)[keyof typeof EXPENSE_PAYOUT_STATUS];

export const EXPENSE_ROW_ACTION = {
  Paying: "paying",
  PayNow: "pay_now",
} as const;

export type ExpenseRowAction =
  (typeof EXPENSE_ROW_ACTION)[keyof typeof EXPENSE_ROW_ACTION];

export const EXPENSE_CHART_LINE_COLOR = "#6284F5";
export const EXPENSE_CHART_Y_MAX = 6_000;

export const EXPENSE_CHANGE_UP_CLASS = "text-[#0ED000]";
export const EXPENSE_CHANGE_DOWN_CLASS = "text-[#E43222]";
export const EXPENSE_STATUS_PENDING_CLASS = "text-[#0066FF]";
export const EXPENSE_STATUS_FAILED_CLASS = "text-[#E43222]";
export const EXPENSE_STATUS_PAID_CLASS = "text-[#84A20F]";
export const EXPENSE_HISTORY_PAID_CLASS = "text-[#769400]";
export const EXPENSE_HISTORY_FAILED_CLASS = "text-[#FF5353]";

export const OPEN_EXPENSE_TABLE_COLUMNS =
  "minmax(88px,0.7fr) minmax(128px,1fr) minmax(180px,1.6fr) minmax(100px,0.8fr) minmax(120px,1fr) minmax(128px,1.1fr) minmax(72px,0.6fr) minmax(120px,0.9fr)";

export const HISTORY_EXPENSE_TABLE_COLUMNS =
  "minmax(88px,0.7fr) minmax(128px,1fr) minmax(180px,1.6fr) minmax(100px,0.8fr) minmax(120px,1fr) minmax(128px,1.1fr) minmax(72px,0.6fr) minmax(100px,0.85fr)";

export const HISTORY_EXPORT_FILENAME = "expense-history.csv";
