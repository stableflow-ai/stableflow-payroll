import { useCallback, useState, type ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useBatchPayoutCommitQueue } from "@/hooks/use-batch-payout-commit-queue";
import { useQuickPayCommitQueue } from "@/hooks/use-quick-pay-commit-queue";
import { PaySidebar } from "@/views/pay/components/PaySidebar";
import { PAY_NAV_ITEMS } from "@/views/pay/config";

export interface PayLayoutOutletContext {
  setHeaderExtra: (node: ReactNode) => void;
}

export function PayLayout() {
  useQuickPayCommitQueue();
  useBatchPayoutCommitQueue();
  const { pathname } = useLocation();
  const active = PAY_NAV_ITEMS.find((item) => item.to === pathname);
  const [headerExtra, setHeaderExtraState] = useState<ReactNode>(null);
  const setHeaderExtra = useCallback((node: ReactNode) => {
    setHeaderExtraState(node);
  }, []);

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
      <PaySidebar />
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-montserrat text-[26px] font-medium text-black">
            {active?.label ?? "Pay"}
          </h1>
          {headerExtra}
        </div>
        <div className="mt-6">
          <Outlet context={{ setHeaderExtra } satisfies PayLayoutOutletContext} />
        </div>
      </div>
    </div>
  );
}
