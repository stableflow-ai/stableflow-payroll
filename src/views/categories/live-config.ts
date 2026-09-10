export const OPERATION_RECENT_PAGE_SIZE = 10;
export const OPERATION_RECENT_LIMIT_MAX = 100;
export const RECENT_PAYOUTS_POLL_MS = 30_000;
export const OPERATION_HISTORY_PAGE_SIZE = 10;

export const OPERATION_TAB = {
  Payments: "payments",
  History: "history",
} as const;

export type OperationTab = (typeof OPERATION_TAB)[keyof typeof OPERATION_TAB];

