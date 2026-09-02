/**
 * Central query-key factory. Mutations (login, register, quotes, submits) do
 * not need keys. Add a namespace here when you introduce a `useQuery`.
 *
 *   order: {
 *     all: ["order"] as const,
 *     detail: (id: string | number) => [...queryKeys.order.all, "detail", id] as const,
 *   },
 */
export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    profile: ["auth", "profile"] as const,
  },
  payout: {
    all: ["payout"] as const,
    pending: ["payout", "pending"] as const,
    overview: ["payout", "overview"] as const,
    volume: (period: string) => [...queryKeys.payout.all, "volume", period] as const,
    recent: ["payout", "recent"] as const,
    payments: (params: unknown) => [...queryKeys.payout.all, "payments", params] as const,
    singleQuote: (body: unknown) => [...queryKeys.payout.all, "single-quote", body] as const,
    payrollPayment: (id: string) => [...queryKeys.payout.all, "payroll-payment", id] as const,
    batchQuote: (body: unknown) => [...queryKeys.payout.all, "batch-quote", body] as const,
    payrollBatch: (body: unknown) => [...queryKeys.payout.all, "payroll-batch", body] as const,
    payrollBatchTransaction: (id: string) => [...queryKeys.payout.all, "payroll-batch-tx", id] as const,
  },
  recipient: {
    all: ["recipient"] as const,
  },
  analytics: {
    all: ["analytics"] as const,
    month: (month: string) => [...queryKeys.analytics.all, "month", month] as const,
  },
  request: {
    all: ["request"] as const,
    payments: ["request", "payments"] as const,
    withdrawCount: ["request", "withdraw-count"] as const,
    detail: (id: number) => [...queryKeys.request.all, "detail", id] as const,
  },
  partner: {
    all: ["partner"] as const,
    me: ["partner", "me"] as const,
    keys: ["partner", "keys"] as const,
    analytics: (params: unknown) => [...queryKeys.partner.all, "analytics", params] as const,
    payments: (params: unknown) => [...queryKeys.partner.all, "payments", params] as const,
  },
} as const;
