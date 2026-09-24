import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { IconAlertCircle } from "@stableflow/pay-ui/icons/alert-circle";
import { IconArrowDown } from "@stableflow/pay-ui/icons/arrow-down";
import { IconCalendar } from "@stableflow/pay-ui/icons/calendar";
import { IconMember } from "@stableflow/pay-ui/icons/member";
import { IconRequest } from "@stableflow/pay-ui/icons/request";
import { Icon2Right } from "@stableflow/pay-ui/icons/to-right";
import { Card } from "@stableflow/pay-ui/card";
import { useClickOrganizationHighPriorityMutation } from "@/hooks/use-admin-overview-api";
import { organizationId } from "@/lib/auth-role";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { ORGANIZATION_HIGH_PRIORITY_CATEGORY } from "@/types/organization";
import { HISTORY_TAB_ANCHOR_ID } from "@/views/pay/history-tab";
import type { AdminHighPriorityItem } from "./utils";

function kindIcon(kind: AdminHighPriorityItem["kind"]): ReactNode {
  if (kind === ORGANIZATION_HIGH_PRIORITY_CATEGORY.Payroll) {
    return (
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#6284F5] text-white">
        <IconCalendar className="size-4" />
      </span>
    );
  }
  if (kind === ORGANIZATION_HIGH_PRIORITY_CATEGORY.PaymentRequest) {
    return (
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#84A20F]/20 text-[#84A20F]">
        <IconRequest className="size-4" />
      </span>
    );
  }
  if (kind === ORGANIZATION_HIGH_PRIORITY_CATEGORY.Join) {
    return (
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#877AFF]/20 text-[#877AFF]">
        <IconMember className="size-4" />
      </span>
    );
  }
  return (
    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E43222]/15 text-[#E43222]">
      <IconAlertCircle className="size-4" />
    </span>
  );
}

export function HighPriorityCard(props: { items: AdminHighPriorityItem[] }) {
  const { items } = props;
  const orgId = organizationId(useAuthStore((state) => state.user));
  const clickMutation = useClickOrganizationHighPriorityMutation();

  return (
    <Card className="flex min-h-[540px] min-w-0 flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-montserrat text-base font-medium capitalize text-black">
          High Priority
        </h2>
        {/* <Link
          to="/pay/payroll"
          className="inline-flex shrink-0 items-center gap-1 font-montserrat text-xs text-[#606060]"
        >
          View All
          <Icon2Right className="h-2 w-[11.5px]" />
        </Link> */}
      </div>
      <div className="mt-5 flex flex-col">
        {items.length === 0 ? (
          <p className="py-8 text-center font-montserrat text-sm text-[#909090]">
            No high-priority items
          </p>
        ) : (
          items.map((item) => (
            <Link
              key={item.id}
              to={item.to}
              state={{ scrollTo: HISTORY_TAB_ANCHOR_ID }}
              onClick={() => {
                if (orgId == null) return;
                clickMutation.mutate(item.kind);
              }}
              className={cn(
                "flex min-w-0 items-center gap-2.5 border-b border-black/10 py-4 last:border-b-0",
              )}
            >
              {kindIcon(item.kind)}
              <div className="min-w-0 flex-1">
                <p className="truncate font-montserrat text-sm font-medium text-black">
                  {item.title}
                </p>
                <p className="mt-0.5 truncate font-montserrat text-[10px] font-normal text-[#606060]">
                  {item.subtitle}
                </p>
              </div>
              <IconArrowDown className="size-2.5 shrink-0 -rotate-90 text-black" />
            </Link>
          ))
        )}
      </div>
    </Card>
  );
}
