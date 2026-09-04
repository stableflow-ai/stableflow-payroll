export const REIMBURSEMENT_TAB = {
  Open: "open",
  History: "history",
} as const;

export type ReimbursementTab =
  (typeof REIMBURSEMENT_TAB)[keyof typeof REIMBURSEMENT_TAB];

export const REIMBURSEMENT_CHART_RANGE = {
  Months6: "6m",
} as const;

export type ReimbursementChartRange =
  (typeof REIMBURSEMENT_CHART_RANGE)[keyof typeof REIMBURSEMENT_CHART_RANGE];

export const REIMBURSEMENT_CHART_RANGE_OPTIONS = [
  { value: REIMBURSEMENT_CHART_RANGE.Months6, label: "Last 6 months" },
] as const;

export const REIMBURSEMENT_PAYOUT_STATUS = {
  Pending: "pending",
  Failed: "failed",
  Paid: "paid",
} as const;

export type ReimbursementPayoutStatus =
  (typeof REIMBURSEMENT_PAYOUT_STATUS)[keyof typeof REIMBURSEMENT_PAYOUT_STATUS];

export const REIMBURSEMENT_ROW_ACTION = {
  Paying: "paying",
  PayNow: "pay_now",
} as const;

export type ReimbursementRowAction =
  (typeof REIMBURSEMENT_ROW_ACTION)[keyof typeof REIMBURSEMENT_ROW_ACTION];

export const REIMBURSEMENT_CHART_LINE_COLOR = "#6284F5";
export const REIMBURSEMENT_CHART_Y_MAX = 6_000;

export const REIMBURSEMENT_CHANGE_UP_CLASS = "text-[#0ED000]";
export const REIMBURSEMENT_CHANGE_DOWN_CLASS = "text-[#E43222]";
export const REIMBURSEMENT_STATUS_PENDING_CLASS = "text-[#0066FF]";
export const REIMBURSEMENT_STATUS_FAILED_CLASS = "text-[#E43222]";
export const REIMBURSEMENT_STATUS_PAID_CLASS = "text-[#84A20F]";
export const REIMBURSEMENT_HISTORY_PAID_CLASS = "text-[#769400]";
export const REIMBURSEMENT_HISTORY_FAILED_CLASS = "text-[#FF5353]";

export const OPEN_REIMBURSEMENT_TABLE_COLUMNS =
  "minmax(88px,0.7fr) minmax(128px,1fr) minmax(180px,1.6fr) minmax(100px,0.8fr) minmax(120px,1fr) minmax(128px,1.1fr) minmax(72px,0.6fr) minmax(120px,0.9fr)";

export const HISTORY_REIMBURSEMENT_TABLE_COLUMNS =
  "minmax(88px,0.7fr) minmax(128px,1fr) minmax(180px,1.6fr) minmax(100px,0.8fr) minmax(120px,1fr) minmax(128px,1.1fr) minmax(72px,0.6fr) minmax(100px,0.85fr)";

export const HISTORY_EXPORT_FILENAME = "reimbursement-history.csv";
