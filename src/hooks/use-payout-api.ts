import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/api/query-keys";
import {
  getPayOverview,
  getPaymentVolume,
  getPayments,
  getRecentPayments,
} from "@/api/payout";
import { useAuthStore } from "@/stores/auth";
import type { PayPaymentsQuery, VolumePeriod } from "@/types/payout";

export function usePayOverviewQuery() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: queryKeys.payout.overview,
    queryFn: getPayOverview,
    enabled: Boolean(token),
  });
}

export function usePaymentVolumeQuery(period: VolumePeriod) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: queryKeys.payout.volume(period),
    queryFn: () => getPaymentVolume(period),
    enabled: Boolean(token),
  });
}

export function useRecentPaymentsQuery() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: queryKeys.payout.recent,
    queryFn: getRecentPayments,
    enabled: Boolean(token),
  });
}

export function usePaymentsQuery(params: PayPaymentsQuery) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: queryKeys.payout.payments(params),
    queryFn: () => getPayments(params),
    enabled: Boolean(token),
  });
}
