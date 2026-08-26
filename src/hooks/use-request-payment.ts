import { useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api/query-keys";
import {
  createPayRequest,
  disablePayRequest,
  getPayRequest,
  getRequestPayments,
  getRequestWithdrawCount,
} from "@/api/request-payment";
import { useAuthStore } from "@/stores/auth";
import type { PayCreateRequestParam } from "@/types/request-payment";
import { REQUEST_WITHDRAW_COUNT_POLL_MS } from "@/views/pay/config";

export function useRequestPaymentsQuery() {
  const token = useAuthStore((state) => state.token);
  const location = useLocation();
  const onRequestPage = location.pathname === "/pay/request";
  return useQuery({
    queryKey: queryKeys.request.payments,
    queryFn: getRequestPayments,
    enabled: Boolean(token) && onRequestPage,
  });
}

export function useRequestWithdrawCountQuery() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: queryKeys.request.withdrawCount,
    queryFn: getRequestWithdrawCount,
    enabled: Boolean(token),
    refetchInterval: REQUEST_WITHDRAW_COUNT_POLL_MS,
  });
}

export function usePayRequestDetailQuery(id: number | null) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: queryKeys.request.detail(id ?? 0),
    queryFn: () => getPayRequest(id!, { auth: Boolean(token) }),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useCreatePayRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: PayCreateRequestParam) => createPayRequest(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.request.all });
    },
  });
}

export function useDisablePayRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => disablePayRequest(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.request.all });
    },
  });
}
