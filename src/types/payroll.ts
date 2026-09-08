export const PAYROLL_TOTAL_PAYOUT_PERIOD = {
  Day: "day",
  Week: "week",
  Month: "month",
} as const;

export type PayrollTotalPayoutPeriod =
  (typeof PAYROLL_TOTAL_PAYOUT_PERIOD)[keyof typeof PAYROLL_TOTAL_PAYOUT_PERIOD];

export interface PayrollCurrentStats {
  totalPayout: string;
  totalPayoutChange: number | null;
  payments: number;
  paymentsChange: number | null;
  averageSalary: string;
  maxSalary: string;
}

export interface PayrollTotalPayoutPoint {
  time: string;
  volume: string;
}

export type PayrollRecentPayoutStatus = "pending" | "failed" | "paid";

export interface PayrollRecentPayout {
  id: string;
  amount: string;
  token: string;
  network: string;
  recipient: string;
  status: PayrollRecentPayoutStatus;
}

export interface PayrollChartPoint {
  label: string;
  value: number;
  highlighted?: boolean;
}

export interface PayrollCurrentStatsQuery {
  organizationId: number;
  timezone: string;
}

export interface PayrollTotalPayoutQuery {
  organizationId: number;
  period: PayrollTotalPayoutPeriod;
  timezone: string;
}

export interface PayrollRecentPayoutsQuery {
  organizationId: number;
  limit: number;
}

export interface PayrollNextQuery {
  organizationId: number;
  timezone: string;
}

export const PAYROLL_IMPORT_DAY_TYPE = {
  FirstDay: "first_day",
  LastDay: "last_day",
  DayOfMonth: "day_of_month",
} as const;

export type PayrollImportDayType =
  (typeof PAYROLL_IMPORT_DAY_TYPE)[keyof typeof PAYROLL_IMPORT_DAY_TYPE];

export interface PayrollRecipientRow {
  id: string;
  name: string;
  address: string;
  email: string;
  token: string;
  network: string;
  amount: string;
  netPay: string;
  memo?: string;
}

export interface PayrollNextRun {
  totalPayout: string;
  recipients: number;
  payDate: string;
  payable: boolean;
  payrollDayType?: PayrollImportDayType;
  payrollDay?: number;
  rows: PayrollRecipientRow[];
}

export type PayrollHistoryRunStatus = "pending" | "failed" | "paid";

export interface PayrollHistoryRun {
  id: string;
  title: string;
  status: PayrollHistoryRunStatus;
  paidCount: number;
  recipientCount: number;
  totalPayout: string;
  transactionCount: number;
  failedCount: number;
  executedAt: string;
}

export interface PayrollHistoryQuery {
  organizationId: number;
  timezone: string;
  page: number;
  pageSize: number;
}

export interface PayrollHistoryResp {
  total: number;
  totalPage: number;
  list: PayrollHistoryRun[];
}

export interface PayrollHistoryDetailQuery {
  organizationId: number;
  timezone: string;
  executionId: string;
}

export interface PayrollHistoryExportQuery {
  organizationId: number;
  timezone: string;
}

export interface PayrollHistoryDetailRow {
  id: string;
  name: string;
  email: string;
  address: string;
  token: string;
  network: string;
  amount: string;
  netPay: string;
  status: PayrollRecentPayoutStatus;
  txHash: string;
}

export interface PayrollHistoryDetail extends PayrollHistoryRun {
  rows: PayrollHistoryDetailRow[];
}

export interface PayrollImportItem {
  name: string;
  address: string;
  amount: string;
  network: string;
  symbol: string;
  email?: string;
  description?: string;
  purpose?: string;
}

export interface PayrollImportParam {
  organizationId: number;
  payrollDayType: PayrollImportDayType;
  payrollDay?: number;
  items: PayrollImportItem[];
}

export interface PayrollImportResp {
  batchId: number;
  count: number;
}

export interface PayrollUpdateItem {
  id?: number;
  name: string;
  address: string;
  amount: string;
  network: string;
  symbol: string;
  email?: string;
}

export interface PayrollUpdateParam {
  organizationId: number;
  payrollDayType: PayrollImportDayType;
  payrollDay?: number;
  items: PayrollUpdateItem[];
  deleteIds?: number[];
}
