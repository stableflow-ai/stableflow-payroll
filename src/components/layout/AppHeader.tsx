import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { HeaderAccountMenu } from "./HeaderAccountMenu";
import { HeaderWalletCapsule } from "./HeaderWalletCapsule";
import { HEADER_NAV_ACTIVE_COLOR, HEADER_NAV_ITEMS, isHeaderNavActive } from "./config";

function HeaderNav({ className }: { className?: string }) {
  const location = useLocation();

  return (
    <nav className={className}>
      {HEADER_NAV_ITEMS.map((item) => {
        const active = isHeaderNavActive(location.pathname, item.to);
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={cn(
              "relative shrink-0 pb-1 font-montserrat text-base font-medium",
              active ? "text-black" : "text-[#606060]",
            )}
          >
            {item.label}
            {active ? (
              <span
                className="absolute bottom-0 left-1/2 h-0.5 w-7 -translate-x-1/2 rounded-full"
                style={{ backgroundColor: HEADER_NAV_ACTIVE_COLOR }}
              />
            ) : null}
          </NavLink>
        );
      })}
    </nav>
  );
}

export function AppHeader() {
  return (
    <header className="border-b border-black/10">
      <div className="mx-auto max-w-[1512px] flex h-[63px] items-center justify-between gap-4 pl-2 md:pl-[35px] pr-2 md:pr-4">
        <img src="/logo.svg" alt="Stableflow Pay" className="h-[29px] w-auto" />
        <HeaderNav className="hidden flex-1 items-center justify-center gap-10 md:flex" />
        <div className="flex items-center gap-2.5">
          <HeaderWalletCapsule />
          <HeaderAccountMenu />
        </div>
      </div>
      <div className="md:hidden">
        <HeaderNav className="flex items-center gap-8 overflow-x-auto px-4 py-2 sm:px-6" />
      </div>
    </header>
  );
}
