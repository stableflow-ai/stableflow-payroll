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
    singleQuote: (body: unknown) => [...queryKeys.payout.all, "single-quote", body] as const,
    batchQuote: (body: unknown) => [...queryKeys.payout.all, "batch-quote", body] as const,
  },
} as const;
