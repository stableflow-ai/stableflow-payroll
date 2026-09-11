import { EXPENSE_IMPORT_LIMITS, EXPENSE_TOTAL_PAYOUT_PERIOD } from "@/types/expense";

export const EXPENSE_PATH = "/pay/expense";
export const EXPENSE_REQUESTS_PATH = "/pay/expense/requests";
export const EXPENSE_HISTORY_PATH = "/pay/expense/history";

export const EXPENSE_TAB = {
  Open: "open",
  Requests: "requests",
  History: "history",
} as const;

export type ExpenseTab =
  (typeof EXPENSE_TAB)[keyof typeof EXPENSE_TAB];

export const EXPENSE_CHART_RANGE = EXPENSE_TOTAL_PAYOUT_PERIOD;

export type ExpenseChartRange =
  (typeof EXPENSE_CHART_RANGE)[keyof typeof EXPENSE_CHART_RANGE];

export const EXPENSE_CHART_RANGE_OPTIONS = [
  { value: EXPENSE_CHART_RANGE.Day, label: "Daily" },
  { value: EXPENSE_CHART_RANGE.Week, label: "Weekly" },
  { value: EXPENSE_CHART_RANGE.Month, label: "Monthly" },
] as const;

export const EXPENSE_RECENT_PAGE_SIZE = 10;
export const EXPENSE_RECENT_LIMIT_MAX = 100;
export const RECENT_PAYOUTS_POLL_MS = 30_000;
export const EXPENSE_HISTORY_PAGE_SIZE = 10;
export const EXPENSE_SEARCH_DEBOUNCE_MS = 300;
export const EXPENSE_OPEN_REQUESTS_COUNT_POLL_MS = 60_000;

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

export const EXPENSE_CHANGE_UP_CLASS = "text-[#0ED000]";
export const EXPENSE_CHANGE_DOWN_CLASS = "text-[#E43222]";
export const EXPENSE_STATUS_PENDING_CLASS = "text-[#0066FF]";
export const EXPENSE_STATUS_FAILED_CLASS = "text-[#E43222]";
export const EXPENSE_STATUS_PAID_CLASS = "text-[#84A20F]";
export const EXPENSE_HISTORY_PAID_CLASS = "text-[#769400]";
export const EXPENSE_HISTORY_FAILED_CLASS = "text-danger";

export const OPEN_EXPENSE_TABLE_COLUMNS =
  "minmax(160px,1.4fr) minmax(88px,0.8fr) minmax(140px,1.1fr) minmax(140px,1.2fr) minmax(80px,0.7fr) minmax(120px,0.9fr)";

export const REQUEST_PAYMENTS_TABLE_COLUMNS =
  "minmax(88px,0.7fr) minmax(128px,1fr) minmax(180px,1.6fr) minmax(120px,1fr) minmax(128px,1.1fr) minmax(72px,0.6fr) minmax(120px,0.9fr)";

export const HISTORY_EXPENSE_TABLE_COLUMNS =
  "minmax(88px,0.7fr) minmax(128px,1fr) minmax(180px,1.6fr) minmax(100px,0.8fr) minmax(120px,1fr) minmax(128px,1.1fr) minmax(72px,0.6fr) minmax(100px,0.85fr)";

export const EXPENSE_DRAWER_TITLE = "Add Expense";
export const EXPENSE_FORM_DESKTOP_QUERY = "(min-width: 768px)";
export const EXPENSE_FORM_MAX_ROWS = 500;
export const EXPENSE_FORM_AMOUNT_MAX_DECIMALS = 6;
export const EXPENSE_FORM_TITLE_MAX = EXPENSE_IMPORT_LIMITS.title;
export const EXPENSE_FORM_COLUMNS =
  "minmax(110px,126px) minmax(110px,140px) minmax(140px,180px) minmax(0,1fr) minmax(120px,160px) 184px 99px 38px";

export const IMPORT_CSV_ACCEPT = ".csv,text/csv";
export const IMPORT_CSV_TEMPLATE_FILENAME = "expense-import-template.csv";
export const IMPORT_CSV_TEMPLATE = [
  "name,recipient,email,amount,token,network,purpose,description",
  "Andrew,0x557be3f47a45499385f60cd64e2ff455e42a3311,alice@example.com,800,USDC,eth,Conference Travel,Invoice of conference.pdf",
  "Hannah,stableflow.near,bob@example.com,252.02,USDT,near,Office Supplies,",
  "Carol,9JXR51yBLBgfesHF8SJgKWkNnx4FxtJCxCc3AV31TBsn,carol@example.com,201.78,USDC,sol,Conference Travel,Airplane Ticket",
].join("\n");
