import { http } from "@/lib/http";
import { PAY_API_PREFIX } from "@/api/config";
import type {
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
