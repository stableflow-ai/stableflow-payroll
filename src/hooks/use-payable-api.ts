import { useQuery } from "@tanstack/react-query";
import { getPayables, payPayable } from "@/api/payable";
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
 * `POST .../salaries/pay/quote` or `.../{batch_id}/pay/quote` — quote + on-chain data.
 * `notification` and `adjustments` are part of the key so a change re-quotes.
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
