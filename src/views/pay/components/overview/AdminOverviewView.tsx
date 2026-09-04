import { useMemo, useState } from "react";
import {
  useAdminOverviewQuery,
  type AdminOverview,
} from "@/hooks/use-admin-overview-api";
import { useAuthStore } from "@/stores/auth";
import type { VolumePeriod } from "@/types/payout";
import { HighPriorityCard } from "./HighPriorityCard";
import { OrgSummaryCard } from "./OrgSummaryCard";
import { PaymentsCard } from "./PaymentsCard";
import { CHART_METRIC, DEFAULT_ADMIN_OVERVIEW_VOLUME_PERIOD, type ChartMetric } from "./config";
import { adminChartPoints } from "./utils";

function AdminOverviewBody(props: { data: AdminOverview }) {
  const { data } = props;
  const user = useAuthStore((state) => state.user);
  const [range, setRange] = useState<VolumePeriod>(DEFAULT_ADMIN_OVERVIEW_VOLUME_PERIOD);
  const [metric, setMetric] = useState<ChartMetric>(CHART_METRIC.Volume);
  const points = useMemo(
    () => adminChartPoints(range, data.volume[range]),
    [data.volume, range],
  );

  return (
    <div className="flex flex-col gap-5">
      <OrgSummaryCard
        ownerEmail={user?.email ?? ""}
        teamMemberCount={data.teamMemberCount}
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,800px)_minmax(0,432px)]">
        <PaymentsCard
          totalPayment={data.totalPayment}
          totalTransactions={data.totalTransactions}
          payrollRecipientCount={data.payrollRecipientCount}
          range={range}
          onRangeChange={setRange}
          metric={metric}
          onMetricChange={setMetric}
          points={points}
        />
        <HighPriorityCard items={data.highPriority} />
      </div>
    </div>
  );
}

export function AdminOverviewView() {
  const query = useAdminOverviewQuery();

  if (query.isPending) {
    return <p className="font-montserrat text-sm text-[#909090]">Loading…</p>;
  }

  if (query.isError) {
    return (
      <p className="font-montserrat text-sm text-danger">
        {query.error instanceof Error ? query.error.message : "Failed to load overview"}
      </p>
    );
  }

  if (!query.data) return null;

  return <AdminOverviewBody data={query.data} />;
}
