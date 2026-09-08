import { useMemo, useState } from "react";
import {
  useOrganizationHighPriorityQuery,
  useOrganizationOverviewQuery,
  useOrganizationPayoutQuery,
} from "@/hooks/use-admin-overview-api";
import { organizationId } from "@/lib/auth-role";
import { useAuthStore } from "@/stores/auth";
import type { VolumePeriod } from "@/types/payout";
import { HighPriorityCard } from "./HighPriorityCard";
import { OrgSummaryCard } from "./OrgSummaryCard";
import { AdminOverviewSkeleton } from "./OverviewSkeleton";
import { PaymentsCard } from "./PaymentsCard";
import { CHART_METRIC, DEFAULT_ADMIN_OVERVIEW_VOLUME_PERIOD, type ChartMetric } from "./config";
import { adminChartPoints, highPriorityDisplayItems } from "./utils";

export function AdminOverviewView() {
  const user = useAuthStore((state) => state.user);
  const orgId = organizationId(user);
  const overviewQuery = useOrganizationOverviewQuery();
  const [range, setRange] = useState<VolumePeriod>(DEFAULT_ADMIN_OVERVIEW_VOLUME_PERIOD);
  const [metric, setMetric] = useState<ChartMetric>(CHART_METRIC.Volume);
  const payoutQuery = useOrganizationPayoutQuery(range);
  const highPriorityQuery = useOrganizationHighPriorityQuery();
  const points = useMemo(
    () => adminChartPoints(range, payoutQuery.data),
    [payoutQuery.data, range],
  );
  const highPriorityItems = useMemo(
    () => highPriorityDisplayItems(highPriorityQuery.data ?? []),
    [highPriorityQuery.data],
  );

  if (orgId === null) {
    return (
      <p className="font-montserrat text-sm text-danger">Organization is missing</p>
    );
  }

  if (overviewQuery.isPending) {
    return <AdminOverviewSkeleton />;
  }

  if (overviewQuery.isError) {
    return (
      <p className="font-montserrat text-sm text-danger">
        {overviewQuery.error instanceof Error
          ? overviewQuery.error.message
          : "Failed to load overview"}
      </p>
    );
  }

  if (!overviewQuery.data) return null;

  return (
    <div className="flex flex-col gap-5">
      <OrgSummaryCard
        ownerEmail={user?.email ?? ""}
        teamMemberCount={overviewQuery.data.teamMembers}
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_0.54fr]">
        <PaymentsCard
          totalPayment={overviewQuery.data.totalPayout}
          paymentCount={overviewQuery.data.totalPayments}
          range={range}
          onRangeChange={setRange}
          metric={metric}
          onMetricChange={setMetric}
          points={points}
        />
        <HighPriorityCard items={highPriorityItems} />
      </div>
    </div>
  );
}
