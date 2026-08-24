import { http } from "@/lib/http";
import { PAY_API_PREFIX } from "@/api/config";
import { getPayAnalytics } from "@/api/analytics";
import { apiNumber, apiText, asRecord } from "@/api/map";
import { ApiError } from "@/lib/api-error";
import type {
  PayBatchQuoteParam,
  PayBatchQuoteResp,
  PayBatchSubmitParam,
  PayBatchSwapResp,
  PayOverview,
  PayPaymentItem,
  PayPaymentsQuery,
  PayPaymentsResp,
  PaySingleQuoteParam,
  PaySingleQuoteResp,
  PaySingleSubmitParam,
  PaySingleSwapParam,
  PaySingleSwapResp,
  VolumePeriod,
  VolumePoint,
} from "@/types/payout";

export function singleQuote(body: PaySingleQuoteParam) {
  return http<PaySingleQuoteResp>(`${PAY_API_PREFIX}/single/quote`, { method: "POST", body });
}

export function singleSwap(body: PaySingleSwapParam) {
  return http<PaySingleSwapResp>(`${PAY_API_PREFIX}/single/swap`, { method: "POST", body });
}

export function singleSubmit(body: PaySingleSubmitParam) {
  return http<void>(`${PAY_API_PREFIX}/single/submit`, { method: "POST", body });
}

export function batchQuote(body: PayBatchQuoteParam) {
  return http<PayBatchQuoteResp>(`${PAY_API_PREFIX}/batch/quote`, { method: "POST", body });
}

export function batchSwap(body: PayBatchQuoteParam) {
  return http<PayBatchSwapResp>(`${PAY_API_PREFIX}/batch/swap`, { method: "POST", body });
}

export function batchSubmit(body: PayBatchSubmitParam) {
  return http<void>(`${PAY_API_PREFIX}/batch/submit`, { method: "POST", body });
}

export function mapPaymentItem(raw: unknown): PayPaymentItem {
  const row = asRecord(raw) ?? {};
  const memo = apiText(row.memo);
  return {
    id: apiText(row.id),
    recipient: apiText(row.recipient),
    amount: apiText(row.amount),
    token: apiText(row.token),
    network: apiText(row.network),
    destinationAmount: apiText(row.destination_amount ?? row.destinationAmount),
    destinationToken: apiText(row.destination_token ?? row.destinationToken),
    destinationNetwork: apiText(row.destination_network ?? row.destinationNetwork),
    destinationTxHash: apiText(row.destination_txHash ?? row.destination_tx_hash ?? row.destinationTxHash),
    txHash: apiText(row.tx_hash ?? row.txHash),
    status: apiText(row.status).toLowerCase(),
    submittedAt: apiText(row.submitted_at ?? row.submittedAt),
    paidAt: apiText(row.paid_at ?? row.paidAt),
    memo: memo || null,
  };
}

function mapPaymentList(data: unknown): PayPaymentItem[] {
  if (Array.isArray(data)) return data.map(mapPaymentItem);
  const row = asRecord(data);
  if (row && Array.isArray(row.payments)) return row.payments.map(mapPaymentItem);
  if (row && Array.isArray(row.list)) return row.list.map(mapPaymentItem);
  if (row && Array.isArray(row.items)) return row.items.map(mapPaymentItem);
  return [];
}

function currentYearMonth(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function getPendingPayments(): Promise<PayPaymentItem[]> {
  return mapPaymentList(await http<unknown>(`${PAY_API_PREFIX}/payments/pending`));
}

export async function getRecentPayments(): Promise<PayPaymentItem[]> {
  return mapPaymentList(await http<unknown>(`${PAY_API_PREFIX}/payments/recent`));
}

export async function getPayOverview(): Promise<PayOverview> {
  try {
    const data = asRecord(await http<unknown>(`${PAY_API_PREFIX}/overview`)) ?? {};
    return {
      totalPayment: apiText(data.total_payment ?? data.totalPayment) || null,
      recipients: apiNumber(data.recipients),
    };
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) throw error;
    const analytics = await getPayAnalytics(currentYearMonth());
    return {
      totalPayment: analytics.stats.totalPayment,
      recipients: analytics.stats.recipients,
    };
  }
}

function volumeValue(row: Record<string, unknown>): number {
  return apiNumber(row.value ?? row.total_payment ?? row.totalPayment ?? row.amount) ?? 0;
}

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatVolumeDate(iso: string, period: VolumePeriod): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const month = MONTH_SHORT[date.getUTCMonth()];
  if (period === "month") return `${month} ${date.getUTCFullYear()}`;
  return `${month} ${date.getUTCDate()}`;
}

function volumeLabel(row: Record<string, unknown>, index: number, period: VolumePeriod): string {
  const explicit = apiText(row.label ?? row.date ?? row.period);
  if (explicit) return explicit;
  const fromStart = formatVolumeDate(apiText(row.start_at ?? row.startAt), period);
  return fromStart || String(index + 1);
}

export async function getPaymentVolume(period: VolumePeriod): Promise<VolumePoint[]> {
  const data = await http<unknown>(`${PAY_API_PREFIX}/payments/volume`, { query: { period } });
  const row = asRecord(data);
  const list = Array.isArray(data)
    ? data
    : Array.isArray(row?.list)
      ? row.list
      : Array.isArray(row?.items)
        ? row.items
        : Array.isArray(row?.points)
          ? row.points
          : [];
  return list.map((item, index) => {
    const point = asRecord(item) ?? {};
    return { label: volumeLabel(point, index, period), value: volumeValue(point) };
  });
}

export async function getPayments(params: PayPaymentsQuery): Promise<PayPaymentsResp> {
  const data = asRecord(await http<unknown>(`${PAY_API_PREFIX}/payments`, {
    query: {
      page: params.page,
      pageSize: params.pageSize,
      q: params.q || undefined,
      status: params.status || undefined,
      token: params.token || undefined,
      start_time: params.start_time,
      end_time: params.end_time,
    },
  })) ?? {};
  const list = mapPaymentList(data.list ?? data.items ?? data.payments);
  return {
    total: apiNumber(data.total) ?? list.length,
    totalPage: Math.max(1, apiNumber(data.total_page ?? data.totalPage) ?? 1),
    list,
  };
}
