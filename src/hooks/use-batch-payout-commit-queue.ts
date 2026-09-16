import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api/query-keys";
import { usePayoutExecutionPoll } from "@/hooks/use-payout-execution-poll";
import { onBatchPayoutCommitSuccess } from "@/stores/batch-payout-commit-queue";

export function useBatchPayoutCommitQueue() {
  const queryClient = useQueryClient();
  usePayoutExecutionPoll();

  useEffect(() => {
    // processAllPendingBatchPayoutCommits is unused: submit is one-shot.
    return onBatchPayoutCommitSuccess(() => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.payout.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.payable.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.payroll.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.expense.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.bonus.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.operation.all });
    });
  }, [queryClient]);
}
