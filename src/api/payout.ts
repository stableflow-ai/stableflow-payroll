import { http } from "@/lib/http";
import { PAY_API_PREFIX } from "@/api/config";
import type {
  PayBatchQuoteParam,
  PayBatchQuoteResp,
  PayBatchSubmitParam,
  PayBatchSwapResp,
  PayPending,
  PayQuickQuoteParam,
  PayQuickQuoteResp,
  PayQuickSubmitParam,
  PayQuickSwapResp,
} from "@/types/payout";

export function quickQuote(body: PayQuickQuoteParam) {
  return http<PayQuickQuoteResp>(`${PAY_API_PREFIX}/quick/quote`, { method: "POST", body });
}

export function quickSwap(body: PayQuickQuoteParam) {
  return http<PayQuickSwapResp>(`${PAY_API_PREFIX}/quick/swap`, { method: "POST", body });
}

export function quickSubmit(body: PayQuickSubmitParam) {
  return http<void>(`${PAY_API_PREFIX}/quick/submit`, { method: "POST", body });
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

export async function getPendingPayments(): Promise<PayPending[]> {
  const data = await http<PayPending[] | { payments: PayPending[] }>(
    `${PAY_API_PREFIX}/payments/pending`,
  );
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.payments)) return data.payments;
  return [];
}
