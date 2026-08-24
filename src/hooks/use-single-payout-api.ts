import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/api/query-keys";
import * as payoutApi from "@/api/payout";
import type { PaySingleQuoteParam, PaySingleSwapParam } from "@/types/payout";

export function useSinglePayQuote(body: PaySingleQuoteParam | null) {
  return useQuery({
    queryKey: queryKeys.payout.singleQuote(body),
    queryFn: () => payoutApi.singleQuote(body!),
    enabled: Boolean(body),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });
}

export function useSinglePaySwap() {
  return useMutation({
    mutationFn: (body: PaySingleSwapParam) => payoutApi.singleSwap(body),
  });
}
