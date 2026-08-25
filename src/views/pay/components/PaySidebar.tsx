import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { usePendingPaymentsQuery } from "@/hooks/use-pending-payments";
import { useRequestWithdrawCountQuery } from "@/hooks/use-request-payment";
import { PAY_NAV_ITEMS } from "../config";

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

  return (
    <nav className="flex shrink-0 gap-2 overflow-x-auto lg:w-[201px] lg:flex-col lg:gap-1.5 lg:overflow-visible">
      {PAY_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const badgeCount =
          item.to === "/pay/request"
            ? requestBadgeCount
            : item.to === "/pay/pending"
              ? pendingPayoutCount
              : 0;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              cn(
                "inline-flex h-11 shrink-0 duration-150 items-center gap-2.5 rounded-[8px] px-3.5 font-montserrat text-sm font-medium whitespace-nowrap",
                isActive
                  ? "bg-white text-[#6284F5] shadow-[0_0_20px_0_rgba(0,0,0,0.06)]"
                  : "text-[#606060]",
              )
            }
          >
            <Icon className={cn("size-3 shrink-0", item.iconClassName)} />
            <span>{item.label}</span>
            <NavBadge count={badgeCount} />
          </NavLink>
        );
      })}
    </nav>
  );
}
