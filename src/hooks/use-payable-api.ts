import { useMutation, useQuery } from "@tanstack/react-query";
import { getPayables, payPayable, setPayableQuoteNotification } from "@/api/payable";
import { queryKeys } from "@/api/query-keys";
import { organizationId } from "@/lib/auth-role";
import { useAuthStore } from "@/stores/auth";
import type { PayablePayRequest } from "@/types/payable";
import { browserTimeZone } from "@/utils";

export function usePayablesQuery(options?: { enabled?: boolean }) {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const orgId = organizationId(user);
  const timezone = browserTimeZone();
  return useQuery({
    queryKey: queryKeys.payable.list(orgId ?? -1, timezone),
    queryFn: () => getPayables(orgId!, timezone),
    enabled: Boolean(token) && orgId !== null && options?.enabled !== false,
  });
}

/**
 * `POST .../salaries/pay/quote`, `.../expenses/pay/quote`, `.../bonuses/pay/quote`,
 * or `.../operations/pay/quote` — quote + on-chain data.
 *
 * `adjustments` are part of the key so a net-pay change re-quotes.
 * Notify Recipient is posted separately and does not re-quote.
 * The mapped value is `{ quoteId, batches }`.
 */
export function usePayablePayQuery(body: PayablePayRequest | null) {
  return useQuery({
    queryKey: queryKeys.payable.pay(body),
    queryFn: () => payPayable(body!),
    enabled: Boolean(body),
    staleTime: 0,
    gcTime: 0,
    retry: 0,
  });
}

export function usePayableQuoteNotificationMutation() {
  return useMutation({
    mutationFn: setPayableQuoteNotification,
  });
}
