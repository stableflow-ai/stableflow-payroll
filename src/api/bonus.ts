import { PAY_API_PREFIX } from "@/api/config";
import { apiNumber, apiText, asRecord } from "@/api/map";
import { http, httpBlob } from "@/lib/http";
import {
  BONUS_IMPORT_LIMITS,
  type BonusCurrentStats,
  type BonusCurrentStatsQuery,
  type BonusHistoryExportQuery,
  type BonusHistoryItem,
  type BonusHistoryQuery,
  type BonusHistoryResp,
  type BonusImportParam,
  type BonusImportResp,
  type BonusOpenQuery,
  type BonusPayoutStatus,
  type BonusPendingItem,
  type BonusPendingList,
  type BonusPendingMember,
  type BonusRecentPayout,
  type BonusRecentPayoutsQuery,
  type BonusRowAction,
  type BonusTotalPayoutPoint,
  type BonusTotalPayoutQuery,
} from "@/types/bonus";

function parseChangePercent(value: unknown): number | null {
  const numeric = apiNumber(value);
  if (numeric != null) return numeric;
  const text = apiText(value).trim();
  if (!text || text === "-" || text === "-%") return null;
  const parsed = Number(text.replace(/%/g, "").replace(/^\+/, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function mapBonusPayoutStatus(value: unknown): BonusPayoutStatus {
  const key = apiText(value).toLowerCase();
  if (key === "completed" || key === "complete" || key === "paid") return "paid";
  if (key === "failed" || key === "expired") return "failed";
  return "pending";
}

function mapBonusRowAction(value: unknown): BonusRowAction {
  const key = apiText(value).toLowerCase();
  if (key === "paying" || key === "processing" || key === "submitted") return "paying";
  return "pay_now";
}

export function mapBonusCurrentStats(raw: unknown): BonusCurrentStats {
  const row = asRecord(raw) ?? {};
  return {
    totalBonus: apiText(row.total_bonus ?? row.totalBonus) || "0",
    totalChangePercent: parseChangePercent(
      row.total_bonus_change ?? row.totalBonusChange,
    ),
    members: apiNumber(row.members) ?? 0,
    membersChangePercent: parseChangePercent(
      row.members_change ?? row.membersChange,
    ),
  };
}

export function mapBonusTotalPayoutPoint(raw: unknown): BonusTotalPayoutPoint {
  const row = asRecord(raw) ?? {};
  return {
    time: apiText(row.time),
    volume: apiText(row.volume) || "0",
  };
}

export function mapBonusRecentPayout(raw: unknown): BonusRecentPayout {
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
    status: mapBonusPayoutStatus(row.status),
  };
}

export function mapBonusOpenMember(
  raw: unknown,
  index = 0,
  batchId?: number,
): BonusPendingMember {
  const row = asRecord(raw) ?? {};
  const id = apiNumber(row.id) ?? index + 1;
  return {
    id: batchId != null ? `${batchId}-${id}` : String(id),
    name: apiText(row.name),
    address: apiText(row.address),
    email: apiText(row.email),
    amount: apiText(row.amount) || "0",
    token: apiText(row.symbol),
  };
}

function sharedMemberToken(members: BonusPendingMember[]): string {
  const tokens = members.map((member) => member.token.trim()).filter(Boolean);
  if (tokens.length === 0) return "";
  const first = tokens[0];
  return tokens.every((token) => token === first) ? first : "";
}

export function mapBonusOpenItem(raw: unknown, index = 0): BonusPendingItem | null {
  const row = asRecord(raw) ?? {};
  const list = Array.isArray(row.list) ? row.list : [];
  const batchId = apiNumber(row.batch_id ?? row.batchId) ?? index + 1;
  const members = list.map((item, memberIndex) =>
    mapBonusOpenMember(item, memberIndex, batchId),
  );
  if (members.length === 0) return null;

  let action: BonusRowAction = "pay_now";
  for (const item of list) {
    const itemRow = asRecord(item) ?? {};
    if (mapBonusRowAction(itemRow.status) === "paying") {
      action = "paying";
      break;
    }
  }

  return {
    id: String(batchId),
    batchId,
    title: apiText(row.title),
    amount: apiText(row.volume) || "0",
    token: sharedMemberToken(members),
    action,
    members,
  };
}

export function mapBonusOpenList(raw: unknown): BonusPendingList {
  const row = asRecord(raw) ?? {};
  const batches = Array.isArray(row.batches) ? row.batches : [];
  const items: BonusPendingItem[] = [];
  for (const [index, batch] of batches.entries()) {
    const item = mapBonusOpenItem(batch, index);
    if (item) items.push(item);
  }
  const memberCount = items.reduce((count, item) => count + item.members.length, 0);
  return {
    totalAmount: apiText(row.total_payout ?? row.totalPayout) || "0",
    token: sharedMemberToken(items.flatMap((item) => item.members)),
    entryCount: apiNumber(row.total_count ?? row.totalCount) ?? memberCount,
    items,
  };
}

export function mapBonusHistoryItem(raw: unknown, index = 0): BonusHistoryItem {
  const row = asRecord(raw) ?? {};
  const id = apiNumber(row.id) ?? apiNumber(row.execution_id ?? row.executionId) ?? index + 1;
  const title = apiText(row.name) || apiText(row.purpose) || "Bonus";
  return {
    id: String(id),
    title,
    totalPayout:
      apiText(row.destination_volume ?? row.destinationVolume)
      || apiText(row.volume)
      || apiText(row.destination_amount ?? row.destinationAmount)
      || apiText(row.amount)
      || "0",
    memberCount: 1,
    executedAt:
      apiText(row.paid_at ?? row.paidAt)
      || apiText(row.submitted_at ?? row.submittedAt)
      || apiText(row.created_at ?? row.createdAt),
    recipient: apiText(row.recipient),
  };
}

export function mapBonusHistoryResp(raw: unknown): BonusHistoryResp {
  const row = asRecord(raw) ?? {};
  const listSource = Array.isArray(row.list) ? row.list : [];
  const list = listSource.map(mapBonusHistoryItem);
  return {
    total: apiNumber(row.total) ?? list.length,
    totalPage: Math.max(1, apiNumber(row.total_page ?? row.totalPage) ?? 1),
    list,
  };
}

export async function getBonusCurrentStats(
  params: BonusCurrentStatsQuery,
): Promise<BonusCurrentStats> {
  const data = await http<unknown>(`${PAY_API_PREFIX}/bonuses/current`, {
    query: {
      organization_id: params.organizationId,
      timezone: params.timezone,
    },
  });
  return mapBonusCurrentStats(data);
}

export async function getBonusTotalPayout(
  params: BonusTotalPayoutQuery,
): Promise<BonusTotalPayoutPoint[]> {
  const data = await http<unknown>(`${PAY_API_PREFIX}/bonuses/total-payout`, {
    query: {
      organization_id: params.organizationId,
      period: params.period,
      timezone: params.timezone,
    },
  });
  const list = Array.isArray(data) ? data : [];
  return list.map(mapBonusTotalPayoutPoint);
}

export async function getBonusRecentPayouts(
  params: BonusRecentPayoutsQuery,
): Promise<BonusRecentPayout[]> {
  const data = await http<unknown>(`${PAY_API_PREFIX}/bonuses/recent`, {
    query: {
      organization_id: params.organizationId,
      limit: params.limit,
    },
  });
  const list = Array.isArray(data) ? data : [];
  return list.map(mapBonusRecentPayout);
}

export async function getBonusOpen(params: BonusOpenQuery): Promise<BonusPendingList> {
  const data = await http<unknown>(`${PAY_API_PREFIX}/bonuses/open`, {
    query: {
      organization_id: params.organizationId,
    },
  });
  return mapBonusOpenList(data);
}

export async function getBonusHistory(params: BonusHistoryQuery): Promise<BonusHistoryResp> {
  const data = await http<unknown>(`${PAY_API_PREFIX}/bonuses/history`, {
    query: {
      organization_id: params.organizationId,
      page: params.page,
      pageSize: params.pageSize,
      start_time: params.startTime,
      end_time: params.endTime,
    },
  });
  return mapBonusHistoryResp(data);
}

const BONUS_HISTORY_EXPORT_FILENAME = "bonus-history.csv";

export function exportBonusHistory(params: BonusHistoryExportQuery) {
  return httpBlob(`${PAY_API_PREFIX}/bonuses/history/export`, {
    query: {
      organization_id: params.organizationId,
      start_time: params.startTime,
      end_time: params.endTime,
    },
    fallbackFilename: BONUS_HISTORY_EXPORT_FILENAME,
  });
}

export function mapBonusImportResp(raw: unknown): BonusImportResp {
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

/** JSON body for `POST /v1/payroll/bonuses/import`. */
export function bonusImportRequestBody(params: BonusImportParam) {
  return {
    organization_id: params.organizationId,
    title: params.title.trim().slice(0, BONUS_IMPORT_LIMITS.title),
    items: params.items.map((item) => {
      const email = optionalImportText(item.email, BONUS_IMPORT_LIMITS.email);
      const description = optionalImportText(
        item.description,
        BONUS_IMPORT_LIMITS.description,
      );
      const purpose = optionalImportText(item.purpose, BONUS_IMPORT_LIMITS.purpose);
      return {
        name: item.name.trim().slice(0, BONUS_IMPORT_LIMITS.name),
        address: item.address.trim().slice(0, BONUS_IMPORT_LIMITS.address),
        amount: item.amount.trim(),
        network: item.network.trim().slice(0, BONUS_IMPORT_LIMITS.network),
        symbol: item.symbol.trim().slice(0, BONUS_IMPORT_LIMITS.symbol),
        ...(email ? { email } : {}),
        ...(description ? { description } : {}),
        ...(purpose ? { purpose } : {}),
      };
    }),
  };
}

export async function importBonuses(params: BonusImportParam): Promise<BonusImportResp> {
  const data = await http<unknown>(`${PAY_API_PREFIX}/bonuses/import`, {
    method: "POST",
    body: bonusImportRequestBody(params),
  });
  return mapBonusImportResp(data);
}
