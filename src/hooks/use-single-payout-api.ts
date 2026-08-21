import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/api/query-keys";
import * as payoutApi from "@/api/payout";
import type { PayQuickQuoteParam } from "@/types/payout";

export function useQuickPayQuote(body: PayQuickQuoteParam | null) {
  return useQuery({
    queryKey: queryKeys.payout.quickQuote(body),
    queryFn: () => payoutApi.quickQuote(body!),
    enabled: Boolean(body),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });
}

export function useQuickPaySwap() {
  return useMutation({
    mutationFn: (body: PayQuickQuoteParam) => payoutApi.quickSwap(body),
  });
}
