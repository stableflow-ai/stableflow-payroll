import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api/query-keys";
import { withdrawConfidentialPayment, type WithdrawConfidentialInput } from "@/lib/confidential/withdraw";

export function useRequestWithdraw() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WithdrawConfidentialInput) => withdrawConfidentialPayment(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.request.all });
    },
  });
}
