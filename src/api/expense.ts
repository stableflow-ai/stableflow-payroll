import { PAY_API_PREFIX } from "@/api/config";
import { apiNumber, apiText, asRecord } from "@/api/map";
import { http, httpBlob } from "@/lib/http";
import {
  EXPENSE_IMPORT_LIMITS,
  type ExpenseCurrentStats,
  type ExpenseCurrentStatsQuery,
  type ExpenseHistoryExportQuery,
  type ExpenseHistoryQuery,
  type ExpenseHistoryResp,
  type ExpenseHistoryRow,
  type ExpenseImportParam,
  type ExpenseImportResp,
  type ExpenseOpenList,
  type ExpenseOpenQuery,
  type ExpenseOpenRequestsCount,
  type ExpenseOpenRow,
  type ExpensePayoutStatus,
  type ExpenseRecentPayout,
  type ExpenseRecentPayoutsQuery,
  type ExpenseRowAction,
  type ExpenseTotalPayoutPoint,
  type ExpenseTotalPayoutQuery,
} from "@/types/expense";

function parseChangePercent(value: unknown): number | null {
  const numeric = apiNumber(value);
  if (numeric != null) return numeric;
  const text = apiText(value).trim();
  if (!text || text === "-" || text === "-%") return null;
  const parsed = Number(text.replace(/%/g, "").replace(/^\+/, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function mapExpensePayoutStatus(value: unknown): ExpensePayoutStatus {
  const key = apiText(value).toLowerCase();
  if (key === "completed" || key === "complete" || key === "paid") return "paid";
  if (key === "failed" || key === "expired") return "failed";
  return "pending";
}

function mapExpenseRowAction(value: unknown): ExpenseRowAction {
  const key = apiText(value).toLowerCase();
  if (key === "paying" || key === "processing" || key === "submitted") return "paying";
  return "pay_now";
}

export function looksLikeExpenseReceipt(value: string): boolean {
  return /\.(pdf|png|jpe?g|webp|gif|docx?)$/i.test(value.trim());
}

export function mapExpenseCurrentStats(raw: unknown): ExpenseCurrentStats {
  const row = asRecord(raw) ?? {};
  return {
    totalExpense: apiText(row.total_reimbursement ?? row.totalReimbursement) || "0",
    totalChangePercent: parseChangePercent(
      row.total_reimbursement_change ?? row.totalReimbursementChange,
    ),
    expensedCount: apiNumber(row.processed_expenses ?? row.processedExpenses) ?? 0,
    expensedChangePercent: parseChangePercent(
      row.processed_expenses_change ?? row.processedExpensesChange,
    ),
    expenseCount: apiNumber(row.total_expenses ?? row.totalExpenses) ?? 0,
    expenseChangePercent: parseChangePercent(
      row.total_expenses_change ?? row.totalExpensesChange,
    ),
  };
}

export function mapExpenseTotalPayoutPoint(raw: unknown): ExpenseTotalPayoutPoint {
  const row = asRecord(raw) ?? {};
  return {
    time: apiText(row.time),
    volume: apiText(row.volume) || "0",
  };
}

export function mapExpenseRecentPayout(raw: unknown): ExpenseRecentPayout {
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
    status: mapExpensePayoutStatus(row.status),
  };
}

export function mapExpenseOpenRow(raw: unknown, index = 0, batchId?: number): ExpenseOpenRow {
  const row = asRecord(raw) ?? {};
  const id = apiNumber(row.id) ?? index + 1;
  const amount = apiText(row.amount) || "0";
  return {
    id: batchId != null ? `${batchId}-${id}` : String(id),
    name: apiText(row.name),
    purpose: apiText(row.purpose),
    receiptName: apiText(row.description),
    expense: apiText(row.volume) || amount,
    address: apiText(row.address),
    token: apiText(row.symbol),
    network: apiText(row.network),
    amount,
    action: mapExpenseRowAction(row.status),
  };
}

export function mapExpenseOpenList(raw: unknown): ExpenseOpenList {
  const row = asRecord(raw) ?? {};
  const batches = Array.isArray(row.batches) ? row.batches : [];
  const rows: ExpenseOpenRow[] = [];
  for (const batch of batches) {
    const batchRow = asRecord(batch) ?? {};
    const list = Array.isArray(batchRow.list) ? batchRow.list : [];
    const batchId = apiNumber(batchRow.batch_id ?? batchRow.batchId);
    for (const [index, item] of list.entries()) {
      rows.push(mapExpenseOpenRow(item, index, batchId ?? undefined));
    }
  }
  return {
    total: apiText(row.total_payout ?? row.totalPayout) || "0",
    count: apiNumber(row.total_count ?? row.totalCount) ?? rows.length,
    rows,
  };
}

export function mapExpenseHistoryRow(raw: unknown, index = 0): ExpenseHistoryRow {
  const row = asRecord(raw) ?? {};
  const id = apiNumber(row.id) ?? apiNumber(row.execution_id ?? row.executionId) ?? index + 1;
  const description = apiText(row.description).trim();
  const amount =
    apiText(row.destination_amount ?? row.destinationAmount)
    || apiText(row.amount)
    || "0";
  const receiptName = looksLikeExpenseReceipt(description) ? description : null;
  return {
    id: String(id),
    name: apiText(row.name),
    purpose: apiText(row.purpose),
    description: receiptName ? null : description || null,
    receiptName,
    expense:
      apiText(row.destination_volume ?? row.destinationVolume)
      || apiText(row.volume)
      || amount,
    address: apiText(row.recipient) || apiText(row.address),
    token: apiText(row.destination_symbol ?? row.destinationSymbol) || apiText(row.symbol),
    network: apiText(row.destination_network ?? row.destinationNetwork) || apiText(row.network),
    amount,
    status: mapExpensePayoutStatus(row.status),
    txHash:
      apiText(row.destination_tx_hash ?? row.destinationTxHash)
      || apiText(row.tx_hash ?? row.txHash)
      || null,
    paidAt:
      apiText(row.paid_at ?? row.paidAt)
      || apiText(row.submitted_at ?? row.submittedAt)
      || apiText(row.created_at ?? row.createdAt),
  };
}

export function mapExpenseHistoryResp(raw: unknown): ExpenseHistoryResp {
  const row = asRecord(raw) ?? {};
  const listSource = Array.isArray(row.list) ? row.list : [];
  const list = listSource.map(mapExpenseHistoryRow);
  return {
    total: apiNumber(row.total) ?? list.length,
    totalPage: Math.max(1, apiNumber(row.total_page ?? row.totalPage) ?? 1),
    list,
  };
}

export async function getExpenseCurrentStats(
  params: ExpenseCurrentStatsQuery,
): Promise<ExpenseCurrentStats> {
  const data = await http<unknown>(`${PAY_API_PREFIX}/expenses/current`, {
    query: {
      organization_id: params.organizationId,
      timezone: params.timezone,
    },
  });
  return mapExpenseCurrentStats(data);
}

export async function getExpenseTotalPayout(
  params: ExpenseTotalPayoutQuery,
): Promise<ExpenseTotalPayoutPoint[]> {
  const data = await http<unknown>(`${PAY_API_PREFIX}/expenses/total-payout`, {
    query: {
      organization_id: params.organizationId,
      period: params.period,
      timezone: params.timezone,
    },
  });
  const list = Array.isArray(data) ? data : [];
  return list.map(mapExpenseTotalPayoutPoint);
}

export async function getExpenseRecentPayouts(
  params: ExpenseRecentPayoutsQuery,
): Promise<ExpenseRecentPayout[]> {
  const data = await http<unknown>(`${PAY_API_PREFIX}/expenses/recent`, {
    query: {
      organization_id: params.organizationId,
      limit: params.limit,
    },
  });
  const list = Array.isArray(data) ? data : [];
  return list.map(mapExpenseRecentPayout);
}

export async function getExpenseOpen(params: ExpenseOpenQuery): Promise<ExpenseOpenList> {
  const data = await http<unknown>(`${PAY_API_PREFIX}/expenses/open`, {
    query: {
      organization_id: params.organizationId,
    },
  });
  return mapExpenseOpenList(data);
}

export function mapExpenseOpenRequestsCount(raw: unknown): ExpenseOpenRequestsCount {
  const row = asRecord(raw) ?? {};
  return {
    count: apiNumber(row.count) ?? 0,
  };
}

export async function getExpenseOpenRequests(
  params: ExpenseOpenQuery,
): Promise<ExpenseOpenList> {
  const data = await http<unknown>(`${PAY_API_PREFIX}/expenses/open/requests`, {
    query: {
      organization_id: params.organizationId,
    },
  });
  return mapExpenseOpenList(data);
}

export async function getExpenseOpenRequestsCount(
  params: ExpenseOpenQuery,
): Promise<ExpenseOpenRequestsCount> {
  const data = await http<unknown>(`${PAY_API_PREFIX}/expenses/open/requests/count`, {
    query: {
      organization_id: params.organizationId,
    },
  });
  return mapExpenseOpenRequestsCount(data);
}

export async function getExpenseHistory(params: ExpenseHistoryQuery): Promise<ExpenseHistoryResp> {
  const data = await http<unknown>(`${PAY_API_PREFIX}/expenses/history`, {
    query: {
      organization_id: params.organizationId,
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      start_time: params.startTime,
      end_time: params.endTime,
    },
  });
  return mapExpenseHistoryResp(data);
}

const EXPENSE_HISTORY_EXPORT_FILENAME = "expense-history.csv";

export function exportExpenseHistory(params: ExpenseHistoryExportQuery) {
  return httpBlob(`${PAY_API_PREFIX}/expenses/history/export`, {
    query: {
      organization_id: params.organizationId,
      search: params.search,
      start_time: params.startTime,
      end_time: params.endTime,
    },
    fallbackFilename: EXPENSE_HISTORY_EXPORT_FILENAME,
  });
}

export function mapExpenseImportResp(raw: unknown): ExpenseImportResp {
  const row = asRecord(raw) ?? {};
  return {
    batchId: apiNumber(row.batch_id ?? row.batchId) ?? 0,
    count: apiNumber(row.count) ?? 0,
  };
}

function optionalImportText(value: string | undefined, max: number): string | undefined {
  const text = value?.trim() ?? "";
  if (!text) return undefined;
  return text.slice(0, max);
}

/** JSON body for `POST /v1/payroll/expenses/import`. */
export function expenseImportRequestBody(params: ExpenseImportParam) {
  return {
    organization_id: params.organizationId,
    title: params.title.trim().slice(0, EXPENSE_IMPORT_LIMITS.title),
    items: params.items.map((item) => {
      const email = optionalImportText(item.email, EXPENSE_IMPORT_LIMITS.email);
      const description = optionalImportText(
        item.description,
        EXPENSE_IMPORT_LIMITS.description,
      );
      const purpose = optionalImportText(item.purpose, EXPENSE_IMPORT_LIMITS.purpose);
      return {
        name: item.name.trim().slice(0, EXPENSE_IMPORT_LIMITS.name),
        address: item.address.trim().slice(0, EXPENSE_IMPORT_LIMITS.address),
        amount: item.amount.trim(),
        network: item.network.trim().slice(0, EXPENSE_IMPORT_LIMITS.network),
        symbol: item.symbol.trim().slice(0, EXPENSE_IMPORT_LIMITS.symbol),
        ...(email ? { email } : {}),
        ...(description ? { description } : {}),
        ...(purpose ? { purpose } : {}),
      };
    }),
  };
}

export async function importExpenses(params: ExpenseImportParam): Promise<ExpenseImportResp> {
  const data = await http<unknown>(`${PAY_API_PREFIX}/expenses/import`, {
    method: "POST",
    body: expenseImportRequestBody(params),
  });
  return mapExpenseImportResp(data);
}
