import { useState } from "react";
import { useReimbursementOverviewQuery } from "@/hooks/use-reimbursement-api";
import { IconLoading } from "@/components/icons/loading";
import { RecentPayoutsCard } from "./components/recent-payouts";
import { ReimbursementRunsCard } from "./components/reimbursement-runs";
import { StatsCard } from "./components/stats";
import { TotalReimbursementChart } from "./components/total-reimbursement";
import {
  REIMBURSEMENT_CHART_RANGE,
  REIMBURSEMENT_TAB,
  type ReimbursementChartRange,
  type ReimbursementTab
} from "./config";

export function ReimbursementView() {
  const overview = useReimbursementOverviewQuery();
  const [tab, setTab] = useState<ReimbursementTab>(REIMBURSEMENT_TAB.Open);
  const [chartRange, setChartRange] = useState<ReimbursementChartRange>(
    REIMBURSEMENT_CHART_RANGE.Months6
  );

  const data = overview.data;

  if (overview.isPending || !data) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <IconLoading className="size-5 animate-spin text-[#909090]" />
      </div>
    );
  }

  if (overview.isError) {
    return (
      <p className="font-montserrat text-sm text-danger">
        {overview.error instanceof Error
          ? overview.error.message
          : "Failed to load reimbursement"}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <StatsCard
        totalReimbursement={data.totalReimbursement}
        totalChangePercent={data.totalChangePercent}
        reimbursedCount={data.reimbursedCount}
        reimbursedChangePercent={data.reimbursedChangePercent}
        reimbursementCount={data.reimbursementCount}
        reimbursementChangePercent={data.reimbursementChangePercent}
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,452px)]">
        <TotalReimbursementChart
          range={chartRange}
          onRangeChange={setChartRange}
          periodLabel={data.chartPeriodLabel}
          currentValue={data.chartCurrentValue}
          points={data.chartPoints}
        />
        <RecentPayoutsCard items={data.recentPayouts} />
      </div>
      <ReimbursementRunsCard
        tab={tab}
        onTabChange={setTab}
        open={data.open}
        history={data.history}
      />
    </div>
  );
}
