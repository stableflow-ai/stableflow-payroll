import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/api/query-keys";
import * as payoutApi from "@/api/payout";
import { useAuthStore } from "@/stores/auth";
import type { PaySingleQuoteParam, PaySingleSwapParam } from "@/types/payout";

export function useSinglePayQuote(body: PaySingleQuoteParam | null, options?: { auth?: boolean }) {
  const auth = options?.auth ?? true;
  return useQuery({
    queryKey: queryKeys.payout.singleQuote({ body, auth }),
    queryFn: () => payoutApi.singleQuote(body!, { auth }),
    enabled: Boolean(body),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });
}

export function useSinglePaySwap(options?: { auth?: boolean }) {
  const auth = options?.auth ?? true;
  return useMutation({
    mutationFn: (body: PaySingleSwapParam) => payoutApi.singleSwap(body, { auth }),
  });
}

/** `POST /v1/payroll/payments` — returns the hosted checkout link to redirect to. */
export function useCreatePayrollPaymentMutation() {
  return useMutation({
    mutationFn: payoutApi.createPayrollPayment,
  });
}

/**
 * `GET /v1/payroll/payments/{payment_id}` — read once on the result page.
 * The checkout only returns here after a successful payment, so there is
 * nothing to poll for.
 */
export function usePayrollPaymentQuery(paymentId: string) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: queryKeys.payout.payrollPayment(paymentId),
    queryFn: () => payoutApi.getPayrollPayment(paymentId),
    enabled: Boolean(paymentId && token),
    retry: 1,
  });
}
