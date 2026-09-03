import { useCallback, useState, type ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { HeaderAccountMenu } from "@/components/layout/HeaderAccountMenu";
import { HeaderWalletCapsule } from "@/components/layout/HeaderWalletCapsule";
import { HEADER_ACCOUNT_MENU_VARIANT } from "@/components/layout/config";
import { useBatchPayoutCommitQueue } from "@/hooks/use-batch-payout-commit-queue";
import { useQuickPayCommitQueue } from "@/hooks/use-quick-pay-commit-queue";
import { PaymentModeTabs } from "@/views/pay/components/PaymentModeTabs";
import { PaySidebar } from "@/views/pay/components/PaySidebar";
import {
  MOCK_ORGANIZATION_NAME,
  isPayModePath,
  payTitleForPath,
} from "@/views/pay/config";

export interface PayLayoutOutletContext {
  setHeaderExtra: (node: ReactNode) => void;
}

export function PayLayout() {
  useQuickPayCommitQueue();
  useBatchPayoutCommitQueue();
  const { pathname } = useLocation();
  const [headerExtra, setHeaderExtraState] = useState<ReactNode>(null);
  const setHeaderExtra = useCallback((node: ReactNode) => {
    setHeaderExtraState(node);
  }, []);
  const showModeTabs = isPayModePath(pathname);

  return (
    <div className="flex flex-col lg:min-h-svh lg:flex-row">
      <div className="flex items-center gap-3 border-b border-black/10 px-2 py-3 md:px-5 lg:hidden">
        <a href="/pay" className="shrink-0">
          <img src="/logo.svg" alt="Stableflow Pay" className="h-[30px] w-auto" />
        </a>
        <div className="min-w-0 flex-1">
          <p className="font-montserrat text-xs font-medium text-[#909090]">
            {MOCK_ORGANIZATION_NAME}
          </p>
          <HeaderAccountMenu variant={HEADER_ACCOUNT_MENU_VARIANT.Sidebar} />
        </div>
        <HeaderWalletCapsule />
      </div>
      <PaySidebar />
      <div className="min-w-0 flex-1 px-2 py-4 md:px-5 lg:px-[26px] lg:py-[15px]">
        <div className="relative flex items-center justify-between gap-3">
          <h1 className="font-montserrat text-[20px] font-medium text-black">
            {payTitleForPath(pathname)}
          </h1>
          <div className="flex items-center gap-3">
            {headerExtra}
            <div className="hidden lg:block">
              <HeaderWalletCapsule />
            </div>
          </div>
        </div>
        {showModeTabs ? (
          <div className="mt-8">
            <PaymentModeTabs />
          </div>
        ) : null}
        <div className={showModeTabs ? "mt-4" : "mt-6"}>
          <Outlet context={{ setHeaderExtra } satisfies PayLayoutOutletContext} />
        </div>
      </div>
    </div>
  );
}
