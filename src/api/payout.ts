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

export async function getPendingPayments(): Promise<PayPending[]> {
  const data = await http<PayPending[] | { payments: PayPending[] }>(
    `${PAY_API_PREFIX}/payments/pending`,
  );
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.payments)) return data.payments;
  return [];
}
