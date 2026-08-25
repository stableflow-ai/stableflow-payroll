import { NavLink } from "react-router-dom";
import { IconLockOutline } from "@/components/icons";
import { cn } from "@/lib/utils";
import { usePartner } from "@/hooks/use-partner";
import { PARTNER_NAV_ITEMS } from "../config";

const ITEM_CLASS =
  "inline-flex h-11 shrink-0 items-center gap-2.5 rounded-[8px] px-3.5 font-montserrat text-sm font-medium whitespace-nowrap duration-150 lg:w-full";

export function PartnerSidebar() {
  const { isPartner } = usePartner();

  return (
    <nav className="flex shrink-0 gap-2 overflow-x-auto lg:w-[220px] lg:flex-col lg:gap-1.5 lg:overflow-visible lg:border-r lg:border-black/10 lg:px-2.5 lg:py-5">
      {PARTNER_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const locked = item.lockedUntilPartner && !isPartner;

        if (locked) {
          return (
            <span
              key={item.to}
              className={cn(ITEM_CLASS, "cursor-default text-[#606060] opacity-50")}
            >
              <Icon className="size-3 shrink-0" />
              <span>{item.label}</span>
              <IconLockOutline className="ml-auto size-3 shrink-0" />
            </span>
          );
        }

        return (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              cn(
                ITEM_CLASS,
                isActive
                  ? "bg-white text-[#6284F5] shadow-[0_0_20px_0_rgba(0,0,0,0.06)]"
                  : "text-[#606060]",
              )
            }
          >
            <Icon className="size-3 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
