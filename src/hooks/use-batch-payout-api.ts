import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/api/query-keys";
import * as payoutApi from "@/api/payout";
import type { PayBatchQuoteParam } from "@/types/payout";

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
