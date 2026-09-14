export const PAYOUT_RETRY_STATUS = {
  Failed: "failed",
  Expired: "expired",
} as const;

export type PayoutRetryStatusValue =
  (typeof PAYOUT_RETRY_STATUS)[keyof typeof PAYOUT_RETRY_STATUS];

export const PAYOUT_RETRY_FAILED_COPY = "This payment transaction has failed";
export const PAYOUT_RETRY_EXPIRED_COPY = "This payment transaction has expired";

export function isPayoutRetryStatus(status: string): status is PayoutRetryStatusValue {
  return status === PAYOUT_RETRY_STATUS.Failed || status === PAYOUT_RETRY_STATUS.Expired;
}

export function payoutRetryCopy(status: PayoutRetryStatusValue): string {
  if (status === PAYOUT_RETRY_STATUS.Expired) return PAYOUT_RETRY_EXPIRED_COPY;
  return PAYOUT_RETRY_FAILED_COPY;
}

export function payoutRetryLabel(status: PayoutRetryStatusValue): string {
  if (status === PAYOUT_RETRY_STATUS.Expired) return "Expired";
  return "Failed";
}

export function payoutExecutionItemId(id: string): number | null {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export function payoutRetrySuccessUrl(path: string): string {
  return `${window.location.origin}${path}`;
}
