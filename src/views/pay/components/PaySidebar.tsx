import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { IconArrowDown } from "@/components/icons/arrow-down";
import { HeaderAccountMenu } from "@/components/layout/HeaderAccountMenu";
import { HEADER_ACCOUNT_MENU_VARIANT } from "@/components/layout/config";
import { userRole } from "@/lib/auth-role";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import {
  MOCK_ORGANIZATION_NAME,
  isPayNavGroup,
  isPayNavLeafActive,
  payNavItemsForRole,
  type PayNavGroupItem,
  type PayNavLeaf,
} from "../config";

function navLinkClass(active: boolean) {
  return cn(
    "inline-flex h-10 w-full shrink-0 items-center gap-2.5 rounded-[8px] px-3.5 font-montserrat text-sm font-medium whitespace-nowrap duration-150",
    "hover:bg-[#EEE]",
    active
      ? "bg-white text-[#06f] shadow-[0_0_20px_0_rgba(0,0,0,0.06)]"
      : "text-[#606060]",
  );
}

function LeafLink(props: { item: PayNavLeaf; onNavigate?: () => void }) {
  const { item, onNavigate } = props;
  const { pathname } = useLocation();
  const active = isPayNavLeafActive(item, pathname);
  const Icon = item.icon;

  return (
    <NavLink to={item.to} end className={navLinkClass(active)} onClick={onNavigate}>
      {Icon ? <Icon className="size-3.5 shrink-0" /> : null}
      <span>{item.label}</span>
    </NavLink>
  );
}

function OperationsGroup(props: { item: PayNavGroupItem; onNavigate?: () => void }) {
  const { item, onNavigate } = props;
  const { pathname } = useLocation();
  const childActive = item.children.some((child) => isPayNavLeafActive(child, pathname));
  const [open, setOpen] = useState(true);
  const Icon = item.icon;

  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(navLinkClass(false), "justify-between")}
        aria-expanded={open}
      >
        <span className="inline-flex min-w-0 items-center gap-2.5">
          <Icon className="size-3.5 shrink-0" />
          <span>{item.label}</span>
        </span>
        <IconArrowDown
          className={cn("h-1 w-2.5 shrink-0 text-[#606060] transition-transform", open ? "" : "-rotate-90")}
        />
      </button>
      {open ? (
        <div className="relative flex flex-col gap-1 pl-2">
          <span
            aria-hidden
            className="absolute top-1 bottom-1 left-[14px] w-px bg-black/10"
          />
          {item.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              end
              onClick={onNavigate}
              className={navLinkClass(isPayNavLeafActive(child, pathname))}
            >
              <span className="pl-6">{child.label}</span>
            </NavLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PayNav(props: { onNavigate?: () => void; className?: string }) {
  const { onNavigate, className } = props;
  const user = useAuthStore((state) => state.user);
  const items = payNavItemsForRole(userRole(user));
  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {items.map((item) =>
        isPayNavGroup(item) ? (
          <OperationsGroup key={item.id} item={item} onNavigate={onNavigate} />
        ) : (
          <LeafLink key={item.id} item={item} onNavigate={onNavigate} />
        ),
      )}
    </nav>
  );
}

export function PaySidebar() {
  return (
    <aside className="hidden shrink-0 flex-col lg:sticky lg:top-0 lg:flex lg:h-svh lg:w-[220px] lg:overflow-y-auto lg:border-r lg:border-black/10">
      <div className="px-[21px] pt-5 pb-4">
        <a href="/" className="inline-flex">
          <img src="/logo.svg" alt="Stableflow Pay" className="h-[30px] w-auto" />
        </a>
        <p className="mt-3.5 font-montserrat text-xs font-medium text-[#909090]">
          {MOCK_ORGANIZATION_NAME}
        </p>
        <div className="mt-2.5">
          <HeaderAccountMenu variant={HEADER_ACCOUNT_MENU_VARIANT.Sidebar} />
        </div>
      </div>
      <div className="h-px w-full bg-black/10" />
      <PayNav className="flex-1 px-2.5 py-5" />
    </aside>
  );
}
