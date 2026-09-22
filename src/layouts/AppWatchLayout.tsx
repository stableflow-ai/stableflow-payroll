import { Outlet } from "react-router-dom";
import { useBatchPayoutCommitQueue } from "@/hooks/use-batch-payout-commit-queue";
import { useMultisigWatchHost } from "@/hooks/use-multisig-watch-host";

export function AppWatchLayout() {
  useBatchPayoutCommitQueue();
  useMultisigWatchHost();
  return <Outlet />;
}
