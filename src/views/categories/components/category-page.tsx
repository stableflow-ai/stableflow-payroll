import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card/Card";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import type { PayLayoutOutletContext } from "@/layouts/PayLayout";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/utils";
import {
  CATEGORY_CHART_RANGE,
  CATEGORY_CHART_RANGE_OPTIONS,
  CATEGORY_DASHBOARD_CHART_LINE_COLOR,
  CATEGORY_DASHBOARD_CHART_POINTS,
  CATEGORY_DASHBOARD_TAB,
  CATEGORY_PAGE_CHART_HIGHLIGHT_LABEL,
  CATEGORY_PAGE_CHART_PERIOD_LABEL,
  CATEGORY_PAGE_CHART_Y_TICKS,
  type CategoryChartRange,
  type CategoryDashboardTab,
} from "../config";
import { CreateCategoryEmpty } from "./create-category-empty";

function formatYTick(value: number) {
  if (value === 0) return "$0";
  return String(value);
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ value?: number | string | ReadonlyArray<number | string> }>;
  label?: string | number;
}) {
  const value = payload?.[0]?.value;
  if (!active || value == null || typeof value !== "number") return null;
  return (
    <div className="rounded-[12px] bg-white px-3 py-2 font-montserrat shadow-[0_0_20px_rgba(0,0,0,0.06)]">
      <p className="text-xs text-[#909090]">{label}</p>
      <p className="text-sm font-medium text-black">
        {formatAmount(value, { padDecimals: true })}
      </p>
    </div>
  );
}

function StatColumn(props: { label: string; value: string }) {
  const { label, value } = props;
  return (
    <div className="min-w-0">
      <p className="font-montserrat text-sm font-medium capitalize text-[#606060]">{label}</p>
      <p className="mt-1.5 font-montserrat text-[20px] font-semibold capitalize text-black">
        {value}
      </p>
      <p className="mt-1.5 font-montserrat text-xs leading-none">
        <span className="font-medium text-[#aaa]">-%</span>{" "}
        <span className="font-normal text-[#aaa]">from last month</span>
      </p>
    </div>
  );
}

function StatsCard() {
  return (
    <Card className="grid grid-cols-1 gap-6 px-10 py-[22px] sm:grid-cols-2 sm:gap-8">
      <StatColumn label="Total Payment" value="0" />
      <StatColumn label="Number of payments" value="0" />
    </Card>
  );
}

function TotalPaymentChart(props: {
  range: CategoryChartRange;
  onRangeChange: (range: CategoryChartRange) => void;
}) {
  const { range, onRangeChange } = props;
  const yMax = CATEGORY_PAGE_CHART_Y_TICKS[CATEGORY_PAGE_CHART_Y_TICKS.length - 1];
  const points = CATEGORY_DASHBOARD_CHART_POINTS.map((point) => ({
    ...point,
    highlighted: point.label === CATEGORY_PAGE_CHART_HIGHLIGHT_LABEL,
  }));

  return (
    <Card className="flex min-h-[454px] flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-montserrat text-base font-medium capitalize text-black">
            Total Payment
          </h2>
          <p className="mt-2 flex flex-wrap items-baseline gap-1.5">
            <span className="font-montserrat text-[20px] font-semibold capitalize text-black">
              {formatAmount(0)}
            </span>
            <span className="font-montserrat text-xs font-normal text-[#aaa]">
              {CATEGORY_PAGE_CHART_PERIOD_LABEL}
            </span>
          </p>
        </div>
        <Dropdown
          value={range}
          onChange={(value) => onRangeChange(value as CategoryChartRange)}
          options={[...CATEGORY_CHART_RANGE_OPTIONS]}
          triggerClassName="h-9 w-[105px] rounded-[18px] border-black/10 bg-transparent px-3 text-xs text-[#606060]"
        />
      </div>
      <div className="mt-4 h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e3e3e3" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={(tickProps) => {
                const { x, y, payload } = tickProps;
                const active = payload?.value === CATEGORY_PAGE_CHART_HIGHLIGHT_LABEL;
                return (
                  <text
                    x={x}
                    y={y}
                    dy={12}
                    textAnchor="middle"
                    fill={active ? "#606060" : "#aaa"}
                    fontSize={12}
                    fontFamily="Montserrat"
                  >
                    {payload?.value}
                  </text>
                );
              }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              domain={[0, yMax]}
              ticks={[...CATEGORY_PAGE_CHART_Y_TICKS]}
              tickFormatter={formatYTick}
              tick={{ fill: "#aaa", fontSize: 12, fontFamily: "Montserrat" }}
              width={48}
            />
            <Tooltip
              content={(tooltipProps) => (
                <ChartTooltip
                  active={tooltipProps.active}
                  payload={tooltipProps.payload}
                  label={tooltipProps.label}
                />
              )}
              cursor={{
                stroke: CATEGORY_DASHBOARD_CHART_LINE_COLOR,
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />
            <Line
              type="linear"
              dataKey="value"
              stroke={CATEGORY_DASHBOARD_CHART_LINE_COLOR}
              strokeWidth={2}
              dot={{
                r: 6,
                fill: CATEGORY_DASHBOARD_CHART_LINE_COLOR,
                stroke: "#fff",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 6,
                fill: CATEGORY_DASHBOARD_CHART_LINE_COLOR,
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function RecentPayoutsCard() {
  return (
    <Card className="flex min-h-[454px] flex-col">
      <h2 className="font-montserrat text-base font-medium capitalize text-black">
        Recent Payouts
      </h2>
      <div className="flex flex-1 items-center justify-center">
        <p className="font-montserrat text-sm font-normal text-[#aaa]">No recent payouts</p>
      </div>
    </Card>
  );
}

function TabButton(props: { active: boolean; onClick: () => void; children: string }) {
  const { active, onClick, children } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative cursor-pointer pb-2.5 font-montserrat text-base text-black",
        active ? "font-semibold" : "font-normal",
      )}
    >
      {children}
      {active ? <span className="absolute inset-x-3 -bottom-px h-[3px] rounded-full bg-[#06f]" /> : null}
    </button>
  );
}

function CategoryRunsCard(props: {
  tab: CategoryDashboardTab;
  onTabChange: (tab: CategoryDashboardTab) => void;
}) {
  const { tab, onTabChange } = props;

  return (
    <div>
      <div className="flex items-end gap-8">
        <TabButton
          active={tab === CATEGORY_DASHBOARD_TAB.Payments}
          onClick={() => onTabChange(CATEGORY_DASHBOARD_TAB.Payments)}
        >
          Payments
        </TabButton>
        <TabButton
          active={tab === CATEGORY_DASHBOARD_TAB.PayoutHistory}
          onClick={() => onTabChange(CATEGORY_DASHBOARD_TAB.PayoutHistory)}
        >
          Payout History
        </TabButton>
      </div>
      <Card className="mt-3 flex min-h-[385px] flex-col px-5 py-6 sm:px-8">
        {tab === CATEGORY_DASHBOARD_TAB.Payments ? (
          <CreateCategoryEmpty />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="font-montserrat text-sm font-normal text-[#aaa]">No payout history</p>
          </div>
        )}
      </Card>
    </div>
  );
}

export function CategoryPage() {
  const { setHeaderExtra } = useOutletContext<PayLayoutOutletContext>();
  const [chartRange, setChartRange] = useState<CategoryChartRange>(CATEGORY_CHART_RANGE.Month);
  const [tab, setTab] = useState<CategoryDashboardTab>(CATEGORY_DASHBOARD_TAB.Payments);

  useEffect(() => {
    setHeaderExtra(null);
    return () => setHeaderExtra(null);
  }, [setHeaderExtra]);

  return (
    <div className="flex flex-col gap-5">
      <StatsCard />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,452px)]">
        <TotalPaymentChart range={chartRange} onRangeChange={setChartRange} />
        <RecentPayoutsCard />
      </div>
      <CategoryRunsCard tab={tab} onTabChange={setTab} />
    </div>
  );
}
