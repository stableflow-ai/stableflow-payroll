import { useCallback, useState, type ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { IconMenu } from "@/components/icons";
import { HeaderAccountMenu } from "@/components/layout/HeaderAccountMenu";
import { HeaderWalletCapsule } from "@/components/layout/HeaderWalletCapsule";
import {
  HEADER_ACCOUNT_MENU_VARIANT,
  HEADER_ACCOUNT_TRIGGER_LABEL,
} from "@/components/layout/config";
import { Drawer } from "@/components/ui/drawer/Drawer";
import { DRAWER_SIDE } from "@/components/ui/drawer/config";
import { useBatchPayoutCommitQueue } from "@/hooks/use-batch-payout-commit-queue";
import { useQuickPayCommitQueue } from "@/hooks/use-quick-pay-commit-queue";
import { isEmployee, organizationName, userRole } from "@/lib/auth-role";
import { useAuthStore } from "@/stores/auth";
import { PaymentModeTabs } from "@/views/pay/components/PaymentModeTabs";
import { RequestPaymentTabs } from "@/views/pay/components/request/RequestPaymentTabs";
import { PayNav, PaySidebar } from "@/views/pay/components/PaySidebar";
import {
  MOCK_ORGANIZATION_NAME,
  isPayModePath,
  isRequestPaymentPath,
  payTitleForPath,
} from "@/views/pay/config";

export interface PayLayoutOutletContext {
  setHeaderExtra: (node: ReactNode) => void;
}

export function PayLayout() {
  useQuickPayCommitQueue();
  useBatchPayoutCommitQueue();
  const { pathname } = useLocation();
  const user = useAuthStore((state) => state.user);
  const [headerExtra, setHeaderExtraState] = useState<ReactNode>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const setHeaderExtra = useCallback((node: ReactNode) => {
    setHeaderExtraState(node);
  }, []);
  const showModeTabs = isPayModePath(pathname) && !isEmployee(user);
  const showRequestTabs = isRequestPaymentPath(pathname);
  const closeMenu = () => setMenuOpen(false);
  const orgName = organizationName(user) ?? MOCK_ORGANIZATION_NAME;

  return (
    <div className="flex flex-col lg:min-h-svh lg:flex-row">
      <div className="flex items-center gap-3 border-b border-black/10 px-2 py-3 md:px-5 lg:hidden">
        <a href="/" className="shrink-0">
          <img src="/logo.svg" alt="Stableflow Pay" className="h-[30px] w-auto" />
        </a>
        <div className="flex justify-end items-center gap-3 flex-1">
          <div className="min-w-0">
            <p className="font-montserrat text-xs font-medium text-[#909090]">
              {orgName}
            </p>
            <HeaderAccountMenu
              variant={HEADER_ACCOUNT_MENU_VARIANT.Sidebar}
              triggerLabel={HEADER_ACCOUNT_TRIGGER_LABEL.Name}
            />
          </div>
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setMenuOpen(true)}
            className="shrink-0 text-black"
          >
            <IconMenu className="h-6 w-6" />
          </button>
        </div>
      </div>
      <PaySidebar />
      <div className="min-w-0 flex-1">
        <div className="relative flex h-[65px] items-center justify-between gap-3 border-b border-black/10 px-2 md:px-5 lg:px-[26px]">
          {showRequestTabs ? (
            <RequestPaymentTabs />
          ) : (
            <h1 className="font-montserrat text-[20px] font-medium text-black">
              {payTitleForPath(pathname, userRole(user))}
            </h1>
          )}
          <div className="flex items-center gap-3">
            {headerExtra}
            <div className="hidden lg:block">
              <HeaderWalletCapsule />
            </div>
          </div>
        </div>
        <div className="px-2 py-5 md:px-5 lg:px-[26px]">
          {showModeTabs ? (
            <div className="mb-4">
              <PaymentModeTabs />
            </div>
          ) : null}
          <Outlet context={{ setHeaderExtra } satisfies PayLayoutOutletContext} />
        </div>
      </div>
      <Drawer
        open={menuOpen}
        onClose={closeMenu}
        side={DRAWER_SIDE.Top}
        title=""
      >
        <PayNav onNavigate={closeMenu} />
      </Drawer>
    </div>
  );
}
