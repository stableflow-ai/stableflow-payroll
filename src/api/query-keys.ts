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
  payroll: {
    all: ["payroll"] as const,
    current: (organizationId: number, timezone: string) =>
      [...queryKeys.payroll.all, "current", organizationId, timezone] as const,
    totalPayout: (organizationId: number, period: string, timezone: string) =>
      [...queryKeys.payroll.all, "total-payout", organizationId, period, timezone] as const,
    recent: (organizationId: number) => [...queryKeys.payroll.all, "recent", organizationId] as const,
    next: (organizationId: number, timezone: string) =>
      [...queryKeys.payroll.all, "next", organizationId, timezone] as const,
    history: (organizationId: number, timezone: string) =>
      [...queryKeys.payroll.all, "history", organizationId, timezone] as const,
    historyDetail: (organizationId: number, executionId: string, timezone: string) =>
      [...queryKeys.payroll.all, "history-detail", organizationId, executionId, timezone] as const,
  },
  expense: {
    all: ["expense"] as const,
    current: (organizationId: number, timezone: string) =>
      [...queryKeys.expense.all, "current", organizationId, timezone] as const,
    totalPayout: (organizationId: number, period: string, timezone: string) =>
      [...queryKeys.expense.all, "total-payout", organizationId, period, timezone] as const,
    recent: (organizationId: number) => [...queryKeys.expense.all, "recent", organizationId] as const,
    open: (organizationId: number) => [...queryKeys.expense.all, "open", organizationId] as const,
    openRequests: (organizationId: number) =>
      [...queryKeys.expense.all, "open-requests", organizationId] as const,
    openRequestsCount: (organizationId: number) =>
      [...queryKeys.expense.all, "open-requests-count", organizationId] as const,
    history: (organizationId: number, params: unknown) =>
      [...queryKeys.expense.all, "history", organizationId, params] as const,
  },
  organization: {
    all: ["organization"] as const,
    detail: (id: number) => [...queryKeys.organization.all, "detail", id] as const,
    overview: (id: number) => [...queryKeys.organization.all, "overview", id] as const,
    payout: (id: number, period: string, timezone: string) =>
      [...queryKeys.organization.all, "payout", id, period, timezone] as const,
    highPriority: (id: number, timezone: string) =>
      [...queryKeys.organization.all, "high-priority", id, timezone] as const,
    info: (orgId: string) => [...queryKeys.organization.all, "info", orgId] as const,
  },
  team: {
    all: ["team"] as const,
    members: (params: unknown) => [...queryKeys.team.all, "members", params] as const,
    book: (orgId: number) => [...queryKeys.team.all, "book", orgId] as const,
  },
} as const;
