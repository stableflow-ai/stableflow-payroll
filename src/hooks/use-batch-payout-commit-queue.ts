import { useEffect } from "react";
import {
  onBatchPayoutCommitSuccess,
  processAllPendingBatchPayoutCommits,
} from "@/stores/batch-payout-commit-queue";

export function useBatchPayoutCommitQueue() {
  useEffect(() => {
    processAllPendingBatchPayoutCommits();
    return onBatchPayoutCommitSuccess(() => undefined);
  }, []);
}
