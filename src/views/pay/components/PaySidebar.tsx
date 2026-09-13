import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { IconArrowDown } from "@/components/icons/arrow-down";
import { IconMore } from "@/components/icons/more";
import { HeaderAccountMenu } from "@/components/layout/HeaderAccountMenu";
import { HEADER_ACCOUNT_MENU_VARIANT } from "@/components/layout/config";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { useExpenseOpenRequestsCountQuery } from "@/hooks/use-expense-api";
import { useOperationCatalogQuery } from "@/hooks/use-operation-api";
import { organizationName, userRole } from "@/lib/auth-role";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { isOperationNavEnabled } from "@/types/operation";
import { CategoriesDrawer } from "@/views/categories";
import { CountBadge } from "./CountBadge";
import {
  isPayNavGroup,
  isPayNavLeafActive,
  PAY_NAV_ID,
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

function MoreCategoriesControl(props: { onClick: () => void }) {
  return (
    <Tooltip
      content="More Categories"
      className="whitespace-nowrap font-medium text-[#606060]"
    >
      <button
        type="button"
        aria-label="More Categories"
        onClick={props.onClick}
        className="inline-flex size-[26px] shrink-0 items-center justify-center rounded-[8px] text-[#AAA] hover:bg-[#F6F6F6]"
      >
        <IconMore className="h-[10px] w-[2.5px]" />
      </button>
    </Tooltip>
  );
}

function OperationsGroup(props: { item: PayNavGroupItem; onNavigate?: () => void }) {
  const { item, onNavigate } = props;
  const { pathname } = useLocation();
  const childActive = item.children.some((child) => isPayNavLeafActive(child, pathname));
  const [open, setOpen] = useState(true);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const Icon = item.icon;
  const expenseRequestCount = useExpenseOpenRequestsCountQuery().data?.count ?? 0;

  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  const toggleOpen = () => setOpen((current) => !current);

  return (
    <div className="flex flex-col gap-1">
      <div className={cn(navLinkClass(false), "justify-between gap-1")}>
        <button
          type="button"
          onClick={toggleOpen}
          className="inline-flex min-w-0 flex-1 items-center gap-2.5"
          aria-expanded={open}
        >
          <Icon className="size-3.5 shrink-0" />
          <span>{item.label}</span>
        </button>
        <MoreCategoriesControl onClick={() => setCategoriesOpen(true)} />
        <button
          type="button"
          onClick={toggleOpen}
          aria-hidden
          tabIndex={-1}
          className="inline-flex shrink-0 items-center"
        >
          <IconArrowDown
            className={cn("h-1 w-2.5 shrink-0 text-[#606060] transition-transform", open ? "" : "-rotate-90")}
          />
        </button>
      </div>
      {open ? (
        <div className="relative flex flex-col gap-1 pl-4">
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
              {child.id === PAY_NAV_ID.Expense ? (
                <CountBadge count={expenseRequestCount} className="ml-auto" />
              ) : null}
            </NavLink>
          ))}
        </div>
      ) : null}
      <CategoriesDrawer
        open={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
}

export function PayNav(props: { onNavigate?: () => void; className?: string }) {
  const { onNavigate, className } = props;
  const user = useAuthStore((state) => state.user);
  const catalogQuery = useOperationCatalogQuery();
  const catalog = (catalogQuery.data ?? [])
    .filter(isOperationNavEnabled)
    .map((item) => ({ category: item.category, name: item.name }));
  const items = payNavItemsForRole(userRole(user), catalog);
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
  const user = useAuthStore((state) => state.user);
  const orgName = organizationName(user) ?? "";

  return (
    <aside className="hidden shrink-0 flex-col lg:sticky lg:top-0 lg:flex lg:h-svh lg:w-[220px] lg:overflow-y-auto lg:border-r lg:border-black/10">
      <div className="px-[21px] pt-5 pb-4">
        <a href="/" className="inline-flex">
          <img src="/logo.svg" alt="Stableflow Pay" className="h-[30px] w-auto" />
        </a>
        <p className="mt-3.5 font-montserrat text-xs font-medium text-[#909090]">
          {orgName}
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
