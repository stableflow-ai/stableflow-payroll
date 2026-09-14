import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/api/query-keys";
import * as payoutApi from "@/api/payout";
import useToast from "@/hooks/use-toast";
import { organizationId } from "@/lib/auth-role";
import { useAuthStore } from "@/stores/auth";
import {
  payoutExecutionItemId,
  payoutRetrySuccessUrl,
} from "@/views/pay/payout-retry";

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

function queryErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

/** Posts `execution_item_id` and sends the browser to the hosted checkout. */
export function useRetryPayoutItem() {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const orgId = organizationId(user);
  const retryPayout = useRetryPayrollPayoutMutation();
  const [retryingId, setRetryingId] = useState<string | null>(null);

  async function retryItem(rowId: string, successPath: string) {
    const itemId = payoutExecutionItemId(rowId);
    if (itemId == null) {
      toast.fail({ title: "Payment item is missing" });
      return;
    }
    if (orgId == null) {
      toast.fail({ title: "Organization is missing" });
      return;
    }
    try {
      setRetryingId(rowId);
      const payment = await retryPayout.mutateAsync({
        execution_item_id: itemId,
        organization_id: orgId,
        success_url: payoutRetrySuccessUrl(successPath),
      });
      window.location.assign(payment.payUrl);
    } catch (error) {
      setRetryingId(null);
      toast.fail({
        title: queryErrorMessage(error, "Unable to create the payment"),
      });
    }
  }

  return { retryItem, retryingId };
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
