import { useState } from "react";
import { useExpenseOverviewQuery } from "@/hooks/use-expense-api";
import { IconLoading } from "@/components/icons/loading";
import { RecentPayoutsCard } from "./components/recent-payouts";
import { ExpenseRunsCard } from "./components/expense-runs";
import { StatsCard } from "./components/stats";
import { TotalExpenseChart } from "./components/total-expense";
import {
  EXPENSE_CHART_RANGE,
  EXPENSE_TAB,
  type ExpenseChartRange,
  type ExpenseTab
} from "./config";

export function ExpenseView() {
  const overview = useExpenseOverviewQuery();
  const [tab, setTab] = useState<ExpenseTab>(EXPENSE_TAB.Open);
  const [chartRange, setChartRange] = useState<ExpenseChartRange>(
    EXPENSE_CHART_RANGE.Months6
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
          : "Failed to load expense"}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <StatsCard
        totalExpense={data.totalExpense}
        totalChangePercent={data.totalChangePercent}
        expensedCount={data.expensedCount}
        expensedChangePercent={data.expensedChangePercent}
        expenseCount={data.expenseCount}
        expenseChangePercent={data.expenseChangePercent}
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,452px)]">
        <TotalExpenseChart
          range={chartRange}
          onRangeChange={setChartRange}
          periodLabel={data.chartPeriodLabel}
          currentValue={data.chartCurrentValue}
          points={data.chartPoints}
        />
        <RecentPayoutsCard items={data.recentPayouts} />
      </div>
      <ExpenseRunsCard
        tab={tab}
        onTabChange={setTab}
        open={data.open}
        history={data.history}
      />
    </div>
  );
}
