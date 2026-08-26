import { http } from "@/lib/http";
import { PAY_API_PREFIX } from "@/api/config";
import { apiNumber, apiText, asRecord } from "@/api/map";
import { ApiError } from "@/lib/api-error";
import { mapPaymentItem } from "@/api/payout";
import type {
  PayCreatePartnerBody,
  PayCreatePartnerResp,
  PayPartner,
  PayPartnerAnalyticsQuery,
  PayPartnerAnalyticsResp,
  PayPartnerKey,
  PayPartnerKeyLabelBody,
  PayPartnerPaymentItem,
  PayPartnerPaymentsQuery,
  PayPartnerPaymentsResp,
} from "@/types/partner";

function mapPartner(raw: unknown): PayPartner | null {
  const row = asRecord(raw);
  if (!row) return null;
  const id = apiNumber(row.id);
  if (id == null || id <= 0) return null;
  return {
    id,
    userId: apiNumber(row.user_id ?? row.userId) ?? 0,
    firstName: apiText(row.first_name ?? row.firstName),
    lastName: apiText(row.last_name ?? row.lastName),
    company: apiText(row.company),
    purpose: apiText(row.purpose),
    website: apiText(row.website),
    telegram: apiText(row.telegram),
    description: apiText(row.description),
    createdAt: apiText(row.created_at ?? row.createdAt),
  };
}

function mapPartnerKey(raw: unknown): PayPartnerKey {
  const row = asRecord(raw) ?? {};
  return {
    id: apiNumber(row.id) ?? 0,
    userId: apiNumber(row.user_id ?? row.userId) ?? 0,
    label: apiText(row.label),
    apiKey: apiText(row.api_key ?? row.apiKey),
    createdAt: apiText(row.created_at ?? row.createdAt),
    status: apiNumber(row.status) ?? 0,
  };
}

function mapPartnerKeyList(data: unknown): PayPartnerKey[] {
  const list = Array.isArray(data)
    ? data
    : Array.isArray(asRecord(data)?.list)
      ? (asRecord(data)?.list as unknown[])
      : [];
  return list.map(mapPartnerKey).filter((row) => row.id > 0);
}

export async function getPartner(): Promise<PayPartner | null> {
  return mapPartner(await http<unknown>(`${PAY_API_PREFIX}/partner`));
}

export async function createPartner(body: PayCreatePartnerBody): Promise<PayCreatePartnerResp> {
  const data = asRecord(await http<unknown>(`${PAY_API_PREFIX}/partner`, { method: "POST", body })) ?? {};
  const id = apiNumber(data.id);
  if (id == null || id <= 0) {
    throw new ApiError("Create partner did not return an id", 400, "PAY_PARTNER");
  }
  return { id };
}

export async function listPartnerKeys(): Promise<PayPartnerKey[]> {
  return mapPartnerKeyList(await http<unknown>(`${PAY_API_PREFIX}/partner/keys`));
}

export async function createPartnerKey(body: PayPartnerKeyLabelBody): Promise<PayPartnerKey> {
  const key = mapPartnerKey(
    await http<unknown>(`${PAY_API_PREFIX}/partner/keys`, { method: "POST", body }),
  );
  if (key.id <= 0) {
    throw new ApiError("Create API key did not return an id", 400, "PAY_PARTNER_KEY");
  }
  return key;
}

export function updatePartnerKeyLabel(id: number, body: PayPartnerKeyLabelBody) {
  return http<void>(`${PAY_API_PREFIX}/partner/keys/${id}`, { method: "POST", body });
}

export function deletePartnerKey(id: number) {
  return http<void>(`${PAY_API_PREFIX}/partner/keys/${id}`, { method: "DELETE" });
}

function mapAnalyticsDailyItem(raw: unknown): PayPartnerAnalyticsResp["dailyStats"][number] {
  const row = asRecord(raw) ?? {};
  return {
    date: apiText(row.date),
    totalAmount: apiText(row.total_amount ?? row.totalAmount),
    transactionCount: apiNumber(row.transaction_count ?? row.transactionCount) ?? 0,
  };
}

function mapAnalyticsTokenItem(raw: unknown): PayPartnerAnalyticsResp["tokenStats"][number] {
  const row = asRecord(raw) ?? {};
  return {
    token: apiText(row.token),
    totalAmount: apiText(row.total_amount ?? row.totalAmount),
    transactionCount: apiNumber(row.transaction_count ?? row.transactionCount) ?? 0,
  };
}

export async function getPartnerAnalytics(
  params: PayPartnerAnalyticsQuery,
): Promise<PayPartnerAnalyticsResp> {
  const data = asRecord(
    await http<unknown>(`${PAY_API_PREFIX}/partner/analytics`, {
      query: {
        api_key_id: params.api_key_id,
        network: params.network,
        start_time: params.start_time,
        end_time: params.end_time,
      },
    }),
  ) ?? {};
  const daily = Array.isArray(data.daily_stats ?? data.dailyStats)
    ? ((data.daily_stats ?? data.dailyStats) as unknown[])
    : [];
  const tokens = Array.isArray(data.token_stats ?? data.tokenStats)
    ? ((data.token_stats ?? data.tokenStats) as unknown[])
    : [];
  return {
    totalVolume: apiText(data.total_volume ?? data.totalVolume),
    dailyStats: daily.map(mapAnalyticsDailyItem),
    tokenStats: tokens.map(mapAnalyticsTokenItem).filter((item) => item.token),
  };
}

function mapPartnerPaymentItem(raw: unknown): PayPartnerPaymentItem {
  const row = asRecord(raw) ?? {};
  const item = mapPaymentItem(raw);
  return {
    id: apiNumber(row.id) ?? 0,
    apiKeyId: apiNumber(row.api_key_id ?? row.apiKeyId) ?? 0,
    payer: apiText(row.payer ?? row.Payer),
    recipient: item.recipient,
    amount: item.amount,
    token: item.token,
    network: item.network,
    destinationAmount: item.destinationAmount,
    destinationToken: item.destinationToken,
    destinationNetwork: item.destinationNetwork,
    destinationTxHash: item.destinationTxHash,
    txHash: item.txHash,
    status: item.status,
    submittedAt: item.submittedAt,
    paidAt: item.paidAt,
    memo: item.memo ?? null,
  };
}

export async function getPartnerPayments(
  params: PayPartnerPaymentsQuery,
): Promise<PayPartnerPaymentsResp> {
  const data = asRecord(
    await http<unknown>(`${PAY_API_PREFIX}/partner/payments`, {
      query: {
        page: params.page,
        pageSize: params.pageSize,
        api_key_id: params.api_key_id,
        network: params.network,
        token: params.token,
        destination_network: params.destination_network,
        destination_token: params.destination_token,
        min_amount: params.min_amount,
        max_amount: params.max_amount,
      },
    }),
  ) ?? {};
  const rawList = Array.isArray(data.list)
    ? data.list
    : Array.isArray(data.items)
      ? data.items
      : Array.isArray(data.payments)
        ? data.payments
        : [];
  const list = rawList.map(mapPartnerPaymentItem).filter((row) => row.id > 0);
  return {
    total: apiNumber(data.total) ?? list.length,
    totalPage: Math.max(1, apiNumber(data.total_page ?? data.totalPage) ?? 1),
    list,
  };
}
