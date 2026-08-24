import { http } from "@/lib/http";
import { PAY_API_PREFIX } from "@/api/config";
import type {
  PayBatchQuoteParam,
  PayBatchQuoteResp,
  PayBatchSubmitParam,
  PayBatchSwapResp,
  PayPending,
  PaySingleQuoteParam,
  PaySingleQuoteResp,
  PaySingleSubmitParam,
  PaySingleSwapParam,
  PaySingleSwapResp,
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

function pendingText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function mapPendingPayment(raw: unknown): PayPending {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const memo = pendingText(row.memo);
  return {
    id: pendingText(row.id) || undefined,
    recipient: pendingText(row.recipient),
    amount: pendingText(row.amount),
    token: pendingText(row.token),
    network: pendingText(row.network),
    submittedAt: pendingText(row.submitted_at ?? row.submittedAt),
    memo: memo || null,
  };
}

export async function getPendingPayments(): Promise<PayPending[]> {
  const data = await http<unknown>(`${PAY_API_PREFIX}/payments/pending`);
  const list = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as { payments?: unknown }).payments)
      ? (data as { payments: unknown[] }).payments
      : [];
  return list.map(mapPendingPayment);
}
