import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/api/query-keys";
import { getPartnerAnalytics, getPartnerPayments } from "@/api/partner";
import { useAuthStore } from "@/stores/auth";
import type { PayPartnerAnalyticsQuery, PayPartnerPaymentsQuery } from "@/types/partner";

export function usePartnerAnalyticsQuery(params: PayPartnerAnalyticsQuery) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: queryKeys.partner.analytics(params),
    queryFn: () => getPartnerAnalytics(params),
    enabled: Boolean(token),
  });
}

export function usePartnerPaymentsQuery(params: PayPartnerPaymentsQuery) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: queryKeys.partner.payments(params),
    queryFn: () => getPartnerPayments(params),
    enabled: Boolean(token),
  });
}
