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
    payrollPayment: (id: string) => [...queryKeys.payout.all, "payroll-payment", id] as const,
    execution: (id: number) => [...queryKeys.payout.all, "execution", id] as const,
  },
  recipient: {
    all: ["recipient"] as const,
  },
  request: {
    all: ["request"] as const,
    list: (params: unknown) => [...queryKeys.request.all, "list", params] as const,
    pending: (orgId: number, limit: number) =>
      [...queryKeys.request.all, "pending", orgId, limit] as const,
    recent: (orgId: number, limit: number) =>
      [...queryKeys.request.all, "recent", orgId, limit] as const,
    defaultAddresses: (orgId: number) =>
      [...queryKeys.request.all, "default-addresses", orgId] as const,
  },
  memberOverview: {
    all: ["member-overview"] as const,
    stats: (orgId: number) => [...queryKeys.memberOverview.all, "stats", orgId] as const,
    payout: (orgId: number, period: string, timezone: string) =>
      [...queryKeys.memberOverview.all, "payout", orgId, period, timezone] as const,
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
  bonus: {
    all: ["bonus"] as const,
    current: (organizationId: number, timezone: string) =>
      [...queryKeys.bonus.all, "current", organizationId, timezone] as const,
    totalPayout: (organizationId: number, period: string, timezone: string) =>
      [...queryKeys.bonus.all, "total-payout", organizationId, period, timezone] as const,
    recent: (organizationId: number) => [...queryKeys.bonus.all, "recent", organizationId] as const,
    open: (organizationId: number) => [...queryKeys.bonus.all, "open", organizationId] as const,
    history: (organizationId: number) => [...queryKeys.bonus.all, "history", organizationId] as const,
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
  payable: {
    all: ["payable"] as const,
    list: (orgId: number, timezone: string) =>
      [...queryKeys.payable.all, "list", orgId, timezone] as const,
    pay: (body: unknown) => [...queryKeys.payable.all, "pay", body] as const,
  },
  history: {
    all: ["history"] as const,
    list: (params: unknown) => [...queryKeys.history.all, "list", params] as const,
  },
} as const;
