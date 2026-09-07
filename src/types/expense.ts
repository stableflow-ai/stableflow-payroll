export const EXPENSE_TOTAL_PAYOUT_PERIOD = {
  Day: "day",
  Week: "week",
  Month: "month",
} as const;

export type ExpenseTotalPayoutPeriod =
  (typeof EXPENSE_TOTAL_PAYOUT_PERIOD)[keyof typeof EXPENSE_TOTAL_PAYOUT_PERIOD];

export interface ExpenseCurrentStats {
  totalExpense: string;
  totalChangePercent: number | null;
  expensedCount: number;
  expensedChangePercent: number | null;
  expenseCount: number;
  expenseChangePercent: number | null;
}

export interface ExpenseCurrentStatsQuery {
  organizationId: number;
  timezone: string;
}

export interface ExpenseTotalPayoutPoint {
  time: string;
  volume: string;
}

export interface ExpenseTotalPayoutQuery {
  organizationId: number;
  period: ExpenseTotalPayoutPeriod;
  timezone: string;
}

export interface ExpenseChartPoint {
  label: string;
  value: number;
  highlighted?: boolean;
}

export type ExpensePayoutStatus = "pending" | "failed" | "paid";

export interface ExpenseRecentPayout {
  id: string;
  amount: string;
  token: string;
  network: string;
  recipient: string;
  status: ExpensePayoutStatus;
}

export interface ExpenseRecentPayoutsQuery {
  organizationId: number;
  limit: number;
}

export type ExpenseRowAction = "paying" | "pay_now";

export interface ExpenseOpenRow {
  id: string;
  batchId: number;
  name: string;
  purpose: string;
  receiptName: string;
  expense: string;
  address: string;
  token: string;
  network: string;
  amount: string;
  action: ExpenseRowAction;
}

export interface ExpenseOpenBatch {
  batchId: number;
  title: string;
  volume: string;
  count: number;
  action: ExpenseRowAction;
  members: ExpenseOpenRow[];
}

export interface ExpenseOpenList {
  total: string;
  count: number;
  batches: ExpenseOpenBatch[];
}

export interface ExpenseOpenQuery {
  organizationId: number;
}

export interface ExpenseOpenRequestsCount {
  count: number;
}

export interface ExpenseHistoryRow {
  id: string;
  name: string;
  purpose: string;
  description: string | null;
  receiptName: string | null;
  expense: string;
  address: string;
  token: string;
  network: string;
  amount: string;
  status: ExpensePayoutStatus;
  txHash: string | null;
  paidAt: string;
}

export interface ExpenseHistoryQuery {
  organizationId: number;
  page: number;
  pageSize: number;
  search?: string;
  startTime?: number;
  endTime?: number;
}

export interface ExpenseHistoryExportQuery {
  organizationId: number;
  search?: string;
  startTime?: number;
  endTime?: number;
}

export interface ExpenseHistoryResp {
  total: number;
  totalPage: number;
  list: ExpenseHistoryRow[];
}

export interface ExpenseDraftRow {
  id: string;
  name: string;
  address: string;
  email: string;
  token: string;
  network: string;
  amount: string;
  purpose: string;
  description: string;
}

/** Field max lengths from `POST /v1/payroll/expenses/import`. */
export const EXPENSE_IMPORT_LIMITS = {
  title: 100,
  name: 50,
  address: 128,
  email: 100,
  network: 32,
  symbol: 32,
  purpose: 100,
  description: 5000,
} as const;

export interface ExpenseImportItem {
  name: string;
  address: string;
  amount: string;
  network: string;
  symbol: string;
  email?: string;
  description?: string;
  purpose?: string;
}

export interface ExpenseImportParam {
  organizationId: number;
  title: string;
  items: ExpenseImportItem[];
}

export interface ExpenseImportResp {
  batchId: number;
  count: number;
}
