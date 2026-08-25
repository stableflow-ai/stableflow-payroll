import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/api/query-keys";
import {
  exportPayments,
  getPayOverview,
  getPaymentVolume,
  getPayments,
  getRecentPayments,
} from "@/api/payout";
import { useAuthStore } from "@/stores/auth";
import type { PayPaymentsExportQuery, PayPaymentsQuery, VolumePeriod } from "@/types/payout";
import { stampDownloadFilename } from "@/views/pay/utils";

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

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

export function useExportPaymentsMutation() {
  return useMutation({
    mutationFn: (params: PayPaymentsExportQuery) => exportPayments(params),
    onSuccess: ({ blob, filename }) => {
      saveBlob(blob, stampDownloadFilename(filename));
    },
  });
}
