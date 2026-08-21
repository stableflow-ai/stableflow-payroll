import { useEffect } from "react";
import {
  onQuickPayCommitSuccess,
  processAllPendingQuickPayCommits,
} from "@/stores/quick-pay-commit-queue";

export function useQuickPayCommitQueue() {
  useEffect(() => {
    processAllPendingQuickPayCommits();
    return onQuickPayCommitSuccess(() => undefined);
  }, []);
}
