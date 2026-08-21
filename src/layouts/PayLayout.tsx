import { Outlet, useLocation } from "react-router-dom";
import { useQuickPayCommitQueue } from "@/hooks/use-quick-pay-commit-queue";
import { PaySidebar } from "@/views/pay/components/PaySidebar";
import { PAY_NAV_ITEMS } from "@/views/pay/config";

export function PayLayout() {
  useQuickPayCommitQueue();
  const { pathname } = useLocation();
  const active = PAY_NAV_ITEMS.find((item) => item.to === pathname);

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
      <PaySidebar />
      <div className="min-w-0 flex-1">
        <h1 className="font-montserrat text-[26px] font-medium text-black">
          {active?.label ?? "Pay"}
        </h1>
        <div className="mt-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
