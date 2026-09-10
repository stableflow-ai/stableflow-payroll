import { PAY_API_PREFIX } from "@/api/config";
import {
  expenseImportRequestBody,
  mapExpenseHistoryResp,
  mapExpenseImportResp,
  mapExpenseOpenList,
  mapExpenseRecentPayout,
  mapExpenseTotalPayoutPoint,
} from "@/api/expense";
import { apiNumber, apiText, asRecord } from "@/api/map";
import { http, httpBlob } from "@/lib/http";
import {
  OPERATION_IMPORT_LIMITS,
  OPERATION_STATUS,
  type OperationCatalogItem,
  type OperationCurrentStats,
  type OperationCurrentStatsQuery,
  type OperationHistoryExportQuery,
  type OperationHistoryQuery,
  type OperationHistoryResp,
  type OperationImportParam,
  type OperationImportResp,
  type OperationOpenList,
  type OperationOpenQuery,
  type OperationRecentPayout,
  type OperationRecentPayoutsQuery,
  type OperationTotalPayoutPoint,
  type OperationTotalPayoutQuery,
} from "@/types/operation";

function parseChangePercent(value: unknown): number | null {
  const numeric = apiNumber(value);
  if (numeric != null) return numeric;
  const text = apiText(value).trim();
  if (!text || text === "-" || text === "-%") return null;
  const parsed = Number(text.replace(/%/g, "").replace(/^\+/, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

export function mapOperationCatalogItem(raw: unknown): OperationCatalogItem | null {
  const row = asRecord(raw);
  if (!row) return null;
  const id = apiNumber(row.id);
  const category = apiText(row.category).trim();
  if (id == null || !category) return null;
  return {
    id,
    category,
    name: apiText(row.name) || category,
    icon: apiText(row.icon),
    description: apiText(row.description),
    added: Boolean(row.added),
    status: apiText(row.status).trim(),
  };
}

export function mapOperationCatalog(raw: unknown): OperationCatalogItem[] {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(asRecord(raw)?.list)
      ? (asRecord(raw)?.list as unknown[])
      : [];
  return list.flatMap((item) => {
    const mapped = mapOperationCatalogItem(item);
    return mapped ? [mapped] : [];
  });
}

export function mapOperationCurrentStats(raw: unknown): OperationCurrentStats {
  const row = asRecord(raw) ?? {};
  return {
    totalPayout: apiText(row.total_payout ?? row.totalPayout) || "0",
    totalChangePercent: parseChangePercent(
      row.total_payout_change ?? row.totalPayoutChange,
    ),
    payouts: apiNumber(row.payouts) ?? 0,
    payoutsChangePercent: parseChangePercent(row.payouts_change ?? row.payoutsChange),
  };
}

export async function getOperationCatalog(
  organizationId: number,
): Promise<OperationCatalogItem[]> {
  return mapOperationCatalog(
    await http<unknown>(`${PAY_API_PREFIX}/operations`, {
      query: { organization_id: organizationId },
    }),
  );
}

export async function addOrganizationOperation(
  organizationId: number,
  operationId: number,
): Promise<OperationCatalogItem> {
  const mapped = mapOperationCatalogItem(
    await http<unknown>(
      `${PAY_API_PREFIX}/organizations/${encodeURIComponent(String(organizationId))}/operations`,
      {
        method: "POST",
        body: { operation_id: operationId },
      },
    ),
  );
  return (
    mapped ?? {
      id: operationId,
      category: "",
      name: "",
      icon: "",
      description: "",
      added: true,
      status: OPERATION_STATUS.Active,
    }
  );
}

export async function updateOrganizationOperationStatus(
  organizationId: number,
  operationId: number,
  status: typeof OPERATION_STATUS.Active | typeof OPERATION_STATUS.Disabled,
): Promise<OperationCatalogItem> {
  const mapped = mapOperationCatalogItem(
    await http<unknown>(
      `${PAY_API_PREFIX}/organizations/${encodeURIComponent(String(organizationId))}/operations/${encodeURIComponent(String(operationId))}`,
      {
        method: "POST",
        body: { status },
      },
    ),
  );
  return (
    mapped ?? {
      id: operationId,
      category: "",
      name: "",
      icon: "",
      description: "",
      added: true,
      status,
    }
  );
}

export async function getOperationCurrentStats(
  params: OperationCurrentStatsQuery,
): Promise<OperationCurrentStats> {
  const data = await http<unknown>(`${PAY_API_PREFIX}/operations/current`, {
    query: {
      category: params.category,
      organization_id: params.organizationId,
      timezone: params.timezone,
    },
  });
  return mapOperationCurrentStats(data);
}

export async function getOperationTotalPayout(
  params: OperationTotalPayoutQuery,
): Promise<OperationTotalPayoutPoint[]> {
  const data = await http<unknown>(`${PAY_API_PREFIX}/operations/total-payout`, {
    query: {
      category: params.category,
      organization_id: params.organizationId,
      period: params.period,
      timezone: params.timezone,
    },
  });
  const list = Array.isArray(data) ? data : [];
  return list.map(mapExpenseTotalPayoutPoint);
}

export async function getOperationRecentPayouts(
  params: OperationRecentPayoutsQuery,
): Promise<OperationRecentPayout[]> {
  const data = await http<unknown>(`${PAY_API_PREFIX}/operations/recent`, {
    query: {
      category: params.category,
      organization_id: params.organizationId,
      limit: params.limit,
    },
  });
  const list = Array.isArray(data) ? data : [];
  return list.map(mapExpenseRecentPayout);
}

export async function getOperationOpen(
  params: OperationOpenQuery,
): Promise<OperationOpenList> {
  const data = await http<unknown>(`${PAY_API_PREFIX}/operations/open`, {
    query: {
      category: params.category,
      organization_id: params.organizationId,
    },
  });
  return mapExpenseOpenList(data);
}

export async function getOperationHistory(
  params: OperationHistoryQuery,
): Promise<OperationHistoryResp> {
  const data = await http<unknown>(`${PAY_API_PREFIX}/operations/history`, {
    query: {
      category: params.category,
      organization_id: params.organizationId,
      page: params.page,
      pageSize: params.pageSize,
      start_time: params.startTime,
      end_time: params.endTime,
    },
  });
  return mapExpenseHistoryResp(data);
}

const OPERATION_HISTORY_EXPORT_FILENAME = "operation-history.csv";

export function exportOperationHistory(params: OperationHistoryExportQuery) {
  return httpBlob(`${PAY_API_PREFIX}/operations/history/export`, {
    query: {
      category: params.category,
      organization_id: params.organizationId,
      start_time: params.startTime,
      end_time: params.endTime,
    },
    fallbackFilename: OPERATION_HISTORY_EXPORT_FILENAME,
  });
}

export function operationImportRequestBody(params: OperationImportParam) {
  return {
    ...expenseImportRequestBody({
      organizationId: params.organizationId,
      title: params.title,
      items: params.items,
    }),
    category: params.category.trim().slice(0, OPERATION_IMPORT_LIMITS.category),
  };
}

export async function importOperations(
  params: OperationImportParam,
): Promise<OperationImportResp> {
  const data = await http<unknown>(`${PAY_API_PREFIX}/operations/import`, {
    method: "POST",
    body: operationImportRequestBody(params),
  });
  return mapExpenseImportResp(data);
}
