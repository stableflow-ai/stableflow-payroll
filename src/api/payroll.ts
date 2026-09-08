import { format, isValid } from "date-fns";
import { PAY_API_PREFIX } from "@/api/config";
import { apiNumber, apiText, asRecord } from "@/api/map";
import { http, httpBlob } from "@/lib/http";
import {
  PAYROLL_IMPORT_DAY_TYPE,
  type PayrollCurrentStats,
  type PayrollCurrentStatsQuery,
  type PayrollHistoryDetail,
  type PayrollHistoryDetailQuery,
  type PayrollHistoryDetailRow,
  type PayrollHistoryExportQuery,
  type PayrollHistoryQuery,
  type PayrollHistoryResp,
  type PayrollHistoryRun,
  type PayrollHistoryRunStatus,
  type PayrollImportDayType,
  type PayrollImportParam,
  type PayrollImportResp,
  type PayrollNextQuery,
  type PayrollUpdateParam,
  type PayrollNextRun,
  type PayrollRecentPayout,
  type PayrollRecentPayoutsQuery,
  type PayrollRecentPayoutStatus,
  type PayrollRecipientRow,
  type PayrollTotalPayoutPoint,
  type PayrollTotalPayoutQuery,
} from "@/types/payroll";

function parseChangePercent(value: unknown): number | null {
  const numeric = apiNumber(value);
  if (numeric != null) return numeric;
  const text = apiText(value).trim();
  if (!text || text === "-" || text === "-%") return null;
  const parsed = Number(text.replace(/%/g, "").replace(/^\+/, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function mapPayrollPayoutStatus(value: unknown): PayrollRecentPayoutStatus {
  const key = apiText(value).toLowerCase();
  if (key === "completed" || key === "complete" || key === "paid") return "paid";
  if (key === "failed" || key === "expired") return "failed";
  return "pending";
}

function mapPayrollDayType(value: unknown): PayrollImportDayType | undefined {
  const key = apiText(value);
  if (key === PAYROLL_IMPORT_DAY_TYPE.FirstDay) return PAYROLL_IMPORT_DAY_TYPE.FirstDay;
  if (key === PAYROLL_IMPORT_DAY_TYPE.LastDay) return PAYROLL_IMPORT_DAY_TYPE.LastDay;
  if (key === PAYROLL_IMPORT_DAY_TYPE.DayOfMonth) return PAYROLL_IMPORT_DAY_TYPE.DayOfMonth;
  return undefined;
}

export function mapPayrollCurrentStats(raw: unknown): PayrollCurrentStats {
  const row = asRecord(raw) ?? {};
  return {
    totalPayout: apiText(row.total_payout ?? row.totalPayout) || "0",
    totalPayoutChange: parseChangePercent(row.total_payout_change ?? row.totalPayoutChange),
    payments: apiNumber(row.payments) ?? 0,
    paymentsChange: parseChangePercent(row.payments_change ?? row.paymentsChange),
    averageSalary: apiText(row.average_salary ?? row.averageSalary) || "0",
    maxSalary: apiText(row.max_salary ?? row.maxSalary) || "0",
  };
}

export function mapPayrollTotalPayoutPoint(raw: unknown): PayrollTotalPayoutPoint {
  const row = asRecord(raw) ?? {};
  return {
    time: apiText(row.time),
    volume: apiText(row.volume) || "0",
  };
}

export function mapPayrollRecentPayout(raw: unknown): PayrollRecentPayout {
  const row = asRecord(raw) ?? {};
  const id = apiNumber(row.id) ?? apiNumber(row.execution_id ?? row.executionId) ?? 0;
  return {
    id: String(id),
    amount:
      apiText(row.destination_amount ?? row.destinationAmount)
      || apiText(row.amount)
      || apiText(row.net_pay ?? row.netPay)
      || "0",
    token: apiText(row.destination_symbol ?? row.destinationSymbol),
    network: apiText(row.destination_network ?? row.destinationNetwork),
    recipient: apiText(row.recipient),
    status: mapPayrollPayoutStatus(row.status),
  };
}

export async function getPayrollCurrentStats(
  params: PayrollCurrentStatsQuery,
): Promise<PayrollCurrentStats> {
  const data = await http<unknown>(`${PAY_API_PREFIX}/salaries/current`, {
    query: {
      organization_id: params.organizationId,
      timezone: params.timezone,
    },
  });
  return mapPayrollCurrentStats(data);
}

export async function getPayrollTotalPayout(
  params: PayrollTotalPayoutQuery,
): Promise<PayrollTotalPayoutPoint[]> {
  const data = await http<unknown>(`${PAY_API_PREFIX}/salaries/total-payout`, {
    query: {
      organization_id: params.organizationId,
      period: params.period,
      timezone: params.timezone,
    },
  });
  const list = Array.isArray(data) ? data : [];
  return list.map(mapPayrollTotalPayoutPoint);
}

export async function getPayrollRecentPayouts(
  params: PayrollRecentPayoutsQuery,
): Promise<PayrollRecentPayout[]> {
  const data = await http<unknown>(`${PAY_API_PREFIX}/salaries/recent`, {
    query: {
      organization_id: params.organizationId,
      limit: params.limit,
    },
  });
  const list = Array.isArray(data) ? data : [];
  return list.map(mapPayrollRecentPayout);
}

export function mapPayrollRecipientRow(raw: unknown, index = 0): PayrollRecipientRow {
  const row = asRecord(raw) ?? {};
  const id = apiNumber(row.id);
  const amount = apiText(row.amount) || "0";
  return {
    id: String(id ?? index + 1),
    name: apiText(row.name),
    address: apiText(row.address),
    email: apiText(row.email),
    token: apiText(row.symbol),
    network: apiText(row.network),
    amount,
    netPay: apiText(row.net_pay ?? row.netPay) || amount,
  };
}

export function mapPayrollNextRun(raw: unknown): PayrollNextRun | null {
  const row = asRecord(raw);
  if (!row) return null;
  const list = Array.isArray(row.list) ? row.list : [];
  const rows = list.map(mapPayrollRecipientRow);
  if (rows.length === 0) return null;
  const payrollDayType = mapPayrollDayType(row.payroll_day_type ?? row.payrollDayType);
  const payrollDay = apiNumber(row.payroll_day ?? row.payrollDay);
  return {
    totalPayout: apiText(row.total_payout ?? row.totalPayout) || "0",
    recipients: apiNumber(row.recipients) ?? rows.length,
    payDate: apiText(row.payment_date ?? row.paymentDate),
    payable: mapPayrollPayable(row.payable),
    ...(payrollDayType ? { payrollDayType } : {}),
    ...(payrollDay != null ? { payrollDay } : {}),
    rows,
  };
}

function mapPayrollPayable(value: unknown): boolean {
  if (value === false || value === 0) return false;
  const text = apiText(value).trim().toLowerCase();
  return text !== "false" && text !== "0";
}

export async function getPayrollNext(params: PayrollNextQuery): Promise<PayrollNextRun | null> {
  const data = await http<unknown>(`${PAY_API_PREFIX}/salaries/next`, {
    query: {
      organization_id: params.organizationId,
      timezone: params.timezone,
    },
  });
  return mapPayrollNextRun(data);
}

export function mapPayrollImportResp(raw: unknown): PayrollImportResp {
  const row = asRecord(raw) ?? {};
  return {
    batchId: apiNumber(row.batch_id ?? row.batchId) ?? 0,
    count: apiNumber(row.count) ?? 0,
  };
}

export async function importPayrollSalaries(params: PayrollImportParam): Promise<PayrollImportResp> {
  const data = await http<unknown>(`${PAY_API_PREFIX}/salaries/import`, {
    method: "POST",
    body: {
      organization_id: params.organizationId,
      payroll_day_type: params.payrollDayType,
      ...(params.payrollDay != null ? { payroll_day: params.payrollDay } : {}),
      items: params.items.map((item) => ({
        name: item.name,
        address: item.address,
        amount: item.amount,
        network: item.network,
        symbol: item.symbol,
        ...(item.email ? { email: item.email } : {}),
        ...(item.description ? { description: item.description } : {}),
        ...(item.purpose ? { purpose: item.purpose } : {}),
      })),
    },
  });
  return mapPayrollImportResp(data);
}

export async function updatePayrollSalaries(params: PayrollUpdateParam): Promise<void> {
  await http<unknown>(`${PAY_API_PREFIX}/salaries/update`, {
    method: "POST",
    body: {
      organization_id: params.organizationId,
      payroll_day_type: params.payrollDayType,
      ...(params.payrollDay != null ? { payroll_day: params.payrollDay } : {}),
      items: params.items.map((item) => ({
        ...(item.id != null ? { id: item.id } : {}),
        name: item.name,
        address: item.address,
        amount: item.amount,
        network: item.network,
        symbol: item.symbol,
        ...(item.email ? { email: item.email } : {}),
      })),
      ...(params.deleteIds && params.deleteIds.length > 0
        ? { delete_ids: params.deleteIds }
        : {}),
    },
  });
}

function payrollHistoryTitle(month: string): string {
  const text = month.trim();
  if (!text) return "Payroll";
  const yearMonth = text.match(/^(\d{4})-(\d{1,2})/);
  if (yearMonth) {
    const date = new Date(Number(yearMonth[1]), Number(yearMonth[2]) - 1, 1);
    if (isValid(date)) return `${format(date, "MMMM")} Payroll`;
  }
  if (/payroll/i.test(text)) return text;
  return `${text} Payroll`;
}

function payrollHistoryStatus(transactions: number, recipients: number): PayrollHistoryRunStatus {
  if (transactions <= 0 && recipients > 0) return "pending";
  return "paid";
}

export function mapPayrollHistoryRun(raw: unknown, index = 0): PayrollHistoryRun {
  const row = asRecord(raw) ?? {};
  const id = apiNumber(row.execution_id ?? row.executionId) ?? index + 1;
  const recipients = apiNumber(row.recipients) ?? 0;
  const transactions = apiNumber(row.transactions) ?? 0;
  const month = apiText(row.month);
  return {
    id: String(id),
    title: payrollHistoryTitle(month),
    status: payrollHistoryStatus(transactions, recipients),
    paidCount: transactions,
    recipientCount: recipients,
    totalPayout: apiText(row.total_payout ?? row.totalPayout) || "0",
    transactionCount: transactions,
    failedCount: 0,
    executedAt: apiText(row.execution_time ?? row.executionTime),
  };
}

export function mapPayrollHistoryResp(raw: unknown): PayrollHistoryResp {
  const row = asRecord(raw) ?? {};
  const listSource = Array.isArray(row.list) ? row.list : [];
  const list = listSource.map(mapPayrollHistoryRun);
  return {
    total: apiNumber(row.total) ?? list.length,
    totalPage: Math.max(1, apiNumber(row.total_page ?? row.totalPage) ?? 1),
    list,
  };
}

export async function getPayrollHistory(params: PayrollHistoryQuery): Promise<PayrollHistoryResp> {
  const data = await http<unknown>(`${PAY_API_PREFIX}/salaries/history`, {
    query: {
      organization_id: params.organizationId,
      page: params.page,
      pageSize: params.pageSize,
      timezone: params.timezone,
    },
  });
  return mapPayrollHistoryResp(data);
}

const PAYROLL_HISTORY_EXPORT_FILENAME = "payroll-history.csv";
const PAYROLL_HISTORY_DETAIL_EXPORT_FILENAME = "payroll-history-detail.csv";

export function exportPayrollHistory(params: PayrollHistoryExportQuery) {
  return httpBlob(`${PAY_API_PREFIX}/salaries/history/export`, {
    query: {
      organization_id: params.organizationId,
      timezone: params.timezone,
    },
    fallbackFilename: PAYROLL_HISTORY_EXPORT_FILENAME,
  });
}

export function exportPayrollHistoryDetail(params: PayrollHistoryDetailQuery) {
  return httpBlob(
    `${PAY_API_PREFIX}/salaries/history/${encodeURIComponent(params.executionId)}/export`,
    {
      query: {
        organization_id: params.organizationId,
        timezone: params.timezone,
      },
      fallbackFilename: PAYROLL_HISTORY_DETAIL_EXPORT_FILENAME,
    },
  );
}

export function mapPayrollHistoryDetailRow(raw: unknown, index = 0): PayrollHistoryDetailRow {
  const row = asRecord(raw) ?? {};
  const id = apiNumber(row.id) ?? index + 1;
  const amount =
    apiText(row.amount)
    || apiText(row.destination_amount ?? row.destinationAmount)
    || "0";
  return {
    id: String(id),
    name: apiText(row.name),
    email: apiText(row.email),
    address: apiText(row.recipient) || apiText(row.address),
    token: apiText(row.destination_symbol ?? row.destinationSymbol) || apiText(row.symbol),
    network: apiText(row.destination_network ?? row.destinationNetwork) || apiText(row.network),
    amount,
    netPay: apiText(row.net_pay ?? row.netPay) || amount,
    status: mapPayrollPayoutStatus(row.status),
    txHash:
      apiText(row.destination_tx_hash ?? row.destinationTxHash)
      || apiText(row.tx_hash ?? row.txHash),
  };
}

export function mapPayrollHistoryDetail(raw: unknown): PayrollHistoryDetail {
  const summary = mapPayrollHistoryRun(raw);
  const row = asRecord(raw) ?? {};
  const list = Array.isArray(row.list) ? row.list : [];
  const rows = list.map(mapPayrollHistoryDetailRow);
  return {
    ...summary,
    failedCount: rows.filter((item) => item.status === "failed").length,
    paidCount: rows.filter((item) => item.status === "paid").length,
    rows,
  };
}

export async function getPayrollHistoryDetail(
  params: PayrollHistoryDetailQuery,
): Promise<PayrollHistoryDetail> {
  const data = await http<unknown>(
    `${PAY_API_PREFIX}/salaries/history/${encodeURIComponent(params.executionId)}`,
    {
      query: {
        organization_id: params.organizationId,
        timezone: params.timezone,
      },
    },
  );
  return mapPayrollHistoryDetail(data);
}
