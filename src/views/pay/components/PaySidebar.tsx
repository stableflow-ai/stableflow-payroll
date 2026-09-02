import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { usePendingPaymentsQuery } from "@/hooks/use-pending-payments";
import { useRequestWithdrawCountQuery } from "@/hooks/use-request-payment";
import { PAY_NAV_GROUP, PAY_NAV_ITEMS } from "../config";

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#6284F5] px-1 font-montserrat text-[10px] font-medium text-white">
      {count}
    </span>
  );
}

export function PaySidebar() {
  const withdrawCountQuery = useRequestWithdrawCountQuery();
  const pendingPayoutsQuery = usePendingPaymentsQuery();
  const pendingPayoutCount = pendingPayoutsQuery.data?.length ?? 0;
  const requestBadgeCount = withdrawCountQuery.data ?? 0;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "inline-flex h-11 shrink-0 duration-150 items-center gap-2.5 rounded-[8px] px-3.5 font-montserrat text-sm font-medium whitespace-nowrap lg:w-full",
      "hover:bg-[#EEE]",
      isActive
        ? "bg-white text-[#6284F5] shadow-[0_0_20px_0_rgba(0,0,0,0.06)]"
        : "text-[#606060]",
    );

  return (
    <nav className="flex shrink-0 gap-2 overflow-x-auto lg:w-[220px] lg:flex-col lg:gap-1.5 lg:overflow-visible lg:border-r lg:border-black/10 lg:px-2.5 lg:py-5">
      <p className="hidden px-3.5 pb-1.5 font-montserrat text-sm font-medium text-[#aaa] lg:block">
        Payout
      </p>
      {PAY_NAV_ITEMS.filter((item) => item.group === PAY_NAV_GROUP.Payout).map((item) => {
        const Icon = item.icon;
        const badgeCount = item.to === "/pay/pending" ? pendingPayoutCount : 0;
        return (
          <NavLink key={item.to} to={item.to} end className={linkClass}>
            <Icon className={cn("size-3 shrink-0", item.iconClassName)} />
            <span>{item.label}</span>
            <NavBadge count={badgeCount} />
          </NavLink>
        );
      })}
      {/* <div className="-mx-2.5 my-1.5 hidden h-px shrink-0 bg-black/10 lg:block" /> */}
      {PAY_NAV_ITEMS.filter((item) => item.group === PAY_NAV_GROUP.Request).map((item) => {
        const Icon = item.icon;
        return (
          <NavLink key={item.to} to={item.to} end className={linkClass}>
            <Icon className={cn("size-3 shrink-0", item.iconClassName)} />
            <span>{item.label}</span>
            <NavBadge count={requestBadgeCount} />
          </NavLink>
        );
      })}
    </nav>
  );
}
