import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/api/query-keys";
import * as payoutApi from "@/api/payout";
import { useAuthStore } from "@/stores/auth";

/** `POST /v1/payroll/payments` — returns the hosted checkout link to redirect to. */
export function useCreatePayrollPaymentMutation() {
  return useMutation({
    mutationFn: payoutApi.createPayrollPayment,
  });
}

/** `POST /v1/payroll/payouts/retry` — hosted checkout for a failed execution item. */
export function useRetryPayrollPayoutMutation() {
  return useMutation({
    mutationFn: payoutApi.retryPayrollPayout,
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
