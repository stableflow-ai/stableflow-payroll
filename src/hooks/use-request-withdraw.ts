import { useMutation } from "@tanstack/react-query";
import { withdrawConfidentialPayment, type WithdrawConfidentialInput } from "@/lib/confidential/withdraw";

export function useRequestWithdraw() {
  return useMutation({
    mutationFn: (input: WithdrawConfidentialInput) => withdrawConfidentialPayment(input),
  });
}
