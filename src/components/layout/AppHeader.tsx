import { NavLink, useLocation } from "react-router-dom";
import { LayoutGroup, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { HeaderAccountMenu } from "./HeaderAccountMenu";
import { HeaderWalletCapsule } from "./HeaderWalletCapsule";
import { HEADER_NAV_ACTIVE_COLOR, HEADER_NAV_ITEMS, isHeaderNavActive } from "./config";

function HeaderNav({ className, cursorId }: { className?: string; cursorId: string }) {
  const location = useLocation();

  return (
    <LayoutGroup id={cursorId}>
      <nav className={className}>
        {HEADER_NAV_ITEMS.map((item) => {
          const active = isHeaderNavActive(location.pathname, item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "relative flex h-full shrink-0 items-center font-montserrat text-base font-medium px-7.5 hover:bg-[#EEE] duration-150",
                active ? "text-black" : "text-[#606060]",
              )}
            >
              {item.label}
              {active ? (
                <motion.span
                  layoutId={cursorId}
                  className="absolute right-0 bottom-0 left-0 mx-auto h-[3px] w-7"
                  style={{ backgroundColor: HEADER_NAV_ACTIVE_COLOR }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              ) : null}
            </NavLink>
          );
        })}
      </nav>
    </LayoutGroup>
  );
}

export function AppHeader() {
  return (
    <header className="border-b border-black/10">
      <div className="flex h-[63px] w-full items-center pr-2 md:pr-4">
        <a
          className="flex h-full shrink-0 items-center pl-2 md:w-[220px] md:pl-[35px]"
          href="/pay"
        >
          <img src="/logo.svg" alt="Stableflow Pay" className="h-[29px] w-auto" />
        </a>
        <HeaderNav
          cursorId="header-nav-cursor-desktop"
          className="hidden h-full min-w-0 flex-1 items-center md:flex"
        />
        <div className="ml-auto flex items-center gap-2.5">
          <HeaderWalletCapsule />
          <HeaderAccountMenu />
        </div>
      </div>
      <div className="h-11 md:hidden">
        <HeaderNav
          cursorId="header-nav-cursor-mobile"
          className="flex h-full items-center gap-8 overflow-x-auto px-4 sm:px-6"
        />
      </div>
    </header>
  );
}
