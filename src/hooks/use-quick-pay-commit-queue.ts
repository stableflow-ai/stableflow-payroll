import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api/query-keys";
import {
  onQuickPayCommitSuccess,
  processAllPendingQuickPayCommits,
} from "@/stores/quick-pay-commit-queue";

export function useQuickPayCommitQueue() {
  const queryClient = useQueryClient();

  useEffect(() => {
    processAllPendingQuickPayCommits();
    return onQuickPayCommitSuccess(() => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.payout.pending });
    });
  }, [queryClient]);
}
