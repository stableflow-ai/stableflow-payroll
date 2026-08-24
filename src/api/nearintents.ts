import { http } from "@/lib/http";
import { ApiError } from "@/lib/api-error";
import { NEARINTENTS_API_PREFIX } from "@/api/config";
import type {
  NearintentsGenerateIntentParam,
  NearintentsGenerateIntentResp,
  NearintentsQuoteParam,
  NearintentsQuoteResp,
  NearintentsStatusResp,
  NearintentsSubmitIntentParam,
  NearintentsSubmitIntentResp,
} from "@/types/nearintents";

const PASSTHROUGH = { envelope: false as const };

export async function nearintentsQuote(body: NearintentsQuoteParam) {
  const data = await http<NearintentsQuoteResp>(`${NEARINTENTS_API_PREFIX}/quote`, {
    method: "POST",
    body,
    ...PASSTHROUGH,
  });
  if (data?.quote?.depositAddress?.trim()) return data;
  const message = data?.message?.trim();
  throw new ApiError(
    message || "Withdraw quote did not return a deposit address",
    400,
    "NEARINTENTS_QUOTE",
  );
}

export function nearintentsGenerateIntent(body: NearintentsGenerateIntentParam) {
  return http<NearintentsGenerateIntentResp>(`${NEARINTENTS_API_PREFIX}/generate-intent`, {
    method: "POST",
    body,
    ...PASSTHROUGH,
  });
}

export function nearintentsSubmitIntent(body: NearintentsSubmitIntentParam) {
  return http<NearintentsSubmitIntentResp>(`${NEARINTENTS_API_PREFIX}/submit-intent`, {
    method: "POST",
    body,
    ...PASSTHROUGH,
  });
}

export function nearintentsStatus(depositAddress: string, depositMemo?: string) {
  return http<NearintentsStatusResp>(`${NEARINTENTS_API_PREFIX}/status`, {
    query: { depositAddress, depositMemo },
    ...PASSTHROUGH,
  });
}
