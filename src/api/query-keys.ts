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
  },
  payout: {
    all: ["payout"] as const,
    quickQuote: (body: unknown) => [...queryKeys.payout.all, "quick-quote", body] as const,
    batchQuote: (body: unknown) => [...queryKeys.payout.all, "batch-quote", body] as const,
  },
} as const;
