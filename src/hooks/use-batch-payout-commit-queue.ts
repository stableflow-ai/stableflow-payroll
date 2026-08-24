import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api/query-keys";
import {
  onBatchPayoutCommitSuccess,
  processAllPendingBatchPayoutCommits,
} from "@/stores/batch-payout-commit-queue";

export function useBatchPayoutCommitQueue() {
  const queryClient = useQueryClient();

  useEffect(() => {
    processAllPendingBatchPayoutCommits();
    return onBatchPayoutCommitSuccess(() => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.payout.pending });
    });
  }, [queryClient]);
}
