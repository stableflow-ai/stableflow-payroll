import { useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api/query-keys";
import {
  createPaymentRequest,
  disablePayRequest,
  getPayRequest,
  getPaymentRequestDefaultAddresses,
  getPaymentRequests,
  getPendingPaymentRequests,
  getRecentPaymentRequests,
  getRequestWithdrawCount,
} from "@/api/request-payment";
import { organizationId } from "@/lib/auth-role";
import { useAuthStore } from "@/stores/auth";
import type {
  CreatePaymentRequestParam,
  PaymentRequestListQuery,
} from "@/types/request-payment";
import {
  PAY_REQUEST_PATH,
  PAY_REQUESTS_PATH,
  REQUEST_WITHDRAW_COUNT_POLL_MS,
} from "@/views/pay/config";

function useOrganizationScope() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const orgId = organizationId(user);
  return {
    orgId,
    enabled: Boolean(token) && orgId !== null,
  };
}

export function usePendingPaymentRequestsQuery(limit: number) {
  const { orgId, enabled } = useOrganizationScope();
  return useQuery({
    queryKey: queryKeys.request.pending(orgId ?? -1, limit),
    queryFn: () =>
      getPendingPaymentRequests({
        organizationId: orgId!,
        limit,
      }),
    enabled,
  });
}

export function useRecentPaymentRequestsQuery(limit: number) {
  const { orgId, enabled } = useOrganizationScope();
  return useQuery({
    queryKey: queryKeys.request.recent(orgId ?? -1, limit),
    queryFn: () =>
      getRecentPaymentRequests({
        organizationId: orgId!,
        limit,
      }),
    enabled,
  });
}

export function usePaymentRequestsQuery(params: Omit<PaymentRequestListQuery, "organizationId"> | null) {
  const { orgId, enabled } = useOrganizationScope();
  return useQuery({
    queryKey: queryKeys.request.list({ organizationId: orgId, ...params }),
    queryFn: () =>
      getPaymentRequests({
        organizationId: orgId!,
        page: params!.page,
        pageSize: params!.pageSize,
        status: params!.status,
      }),
    enabled: enabled && params != null,
  });
}

export function usePaymentRequestDefaultAddressesQuery() {
  const { orgId, enabled } = useOrganizationScope();
  const location = useLocation();
  const onRequestForm = location.pathname === PAY_REQUEST_PATH;
  return useQuery({
    queryKey: queryKeys.request.defaultAddresses(orgId ?? -1),
    queryFn: () => getPaymentRequestDefaultAddresses(orgId!),
    enabled: enabled && onRequestForm,
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
    mutationFn: (body: CreatePaymentRequestParam) => createPaymentRequest(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.request.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.memberOverview.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.payable.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.expense.all });
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
