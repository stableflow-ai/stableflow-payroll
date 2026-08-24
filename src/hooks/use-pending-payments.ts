import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/api/query-keys";
import { getPendingPayments } from "@/api/payout";
import { useAuthStore } from "@/stores/auth";

const PENDING_POLL_MS = 8_000;

export function usePendingPaymentsQuery() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: queryKeys.payout.pending,
    queryFn: getPendingPayments,
    enabled: Boolean(token),
    refetchInterval: (query) => ((query.state.data?.length ?? 0) > 0 ? PENDING_POLL_MS : false),
  });
}
