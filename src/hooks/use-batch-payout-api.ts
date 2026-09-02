import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/api/query-keys";
import * as payoutApi from "@/api/payout";
import { useAuthStore } from "@/stores/auth";
import type { PayBatchQuoteParam, PayrollCreateBatchParam } from "@/types/payout";

export function useBatchPayQuote(body: PayBatchQuoteParam | null) {
  return useQuery({
    queryKey: queryKeys.payout.batchQuote(body),
    queryFn: () => payoutApi.batchQuote(body!),
    enabled: Boolean(body),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });
}

export function useBatchPaySwap() {
  return useMutation({
    mutationFn: (body: PayBatchQuoteParam) => payoutApi.batchSwap(body),
  });
}

/**
 * `POST /v1/payroll/batches` — creates the batch and returns quote + on-chain
 * data. Posted once when preview opens; Refresh calls `refetch()`.
 */
export function useCreatePayrollBatchQuery(body: PayrollCreateBatchParam | null) {
  return useQuery({
    queryKey: queryKeys.payout.payrollBatch(body),
    queryFn: () => payoutApi.createPayrollBatch(body!),
    enabled: Boolean(body),
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    retry: 0,
  });
}

/**
 * `GET /v1/payroll/batches/{batch_id}/transaction` — status lookup.
 * The batch page does not call this (no waiting step after send).
 */
export function usePayrollBatchTransactionQuery(batchId: string) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: queryKeys.payout.payrollBatchTransaction(batchId),
    queryFn: () => payoutApi.getPayrollBatchTransaction(batchId),
    enabled: Boolean(batchId && token),
    retry: 1,
  });
}
