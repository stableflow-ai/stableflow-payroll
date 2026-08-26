import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/api/query-keys";
import * as payoutApi from "@/api/payout";
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
