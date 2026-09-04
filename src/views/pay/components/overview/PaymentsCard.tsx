import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card/Card";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/utils";
import type { VolumePeriod } from "@/types/payout";
import type { AdminOverviewChartPoint } from "@/hooks/use-admin-overview-api";
import {
  ADMIN_CHART_PLOT_RIGHT_MARGIN,
  ADMIN_CHART_Y_AXIS_WIDTH,
  CHART_METRIC,
  CHART_METRIC_COLOR,
  CHART_METRIC_OPTIONS,
  OVERVIEW_CHART_GRID,
  OVERVIEW_LINK_CLASS,
  OVERVIEW_VOLUME_PERIOD_OPTIONS,
  type ChartMetric,
} from "./config";
import {
  adminChartYTicks,
  chartXTickMinPx,
  evenCategoryTicks,
  formatAdminChartAxis,
  maxCategoryTicks,
} from "./utils";

function ChartXTick(props: {
  x?: number;
  y?: number;
  index?: number;
  visibleTicksCount?: number;
  payload?: { value?: string };
}) {
  const { x = 0, y = 0, index = 0, visibleTicksCount = 0, payload } = props;
  const isFirst = index === 0;
  const isLast = visibleTicksCount > 0 && index === visibleTicksCount - 1;
  const anchor =
    visibleTicksCount <= 1 ? "middle" : isFirst ? "start" : isLast ? "end" : "middle";
  return (
    <text x={x} y={y} dy={12} textAnchor={anchor} fill="#aaa" fontSize={12} fontFamily="Montserrat">
      {payload?.value}
    </text>
  );
}

function PaymentsTooltip(props: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: AdminOverviewChartPoint }>;
}) {
  const point = props.payload?.[0]?.payload;
  if (!props.active || !point) return null;

  return (
    <div className="min-w-[180px] rounded-[12px] border border-[#e0e0e0] bg-[#fdfdfd] px-4 py-3.5 font-montserrat text-xs font-medium text-[#606060] shadow-[0_0_20px_0_rgba(0,0,0,0.06)]">
      <p className="text-[#909090]">{point.label}</p>
      <div className="mt-2.5 flex items-center justify-between gap-6">
        <span className="inline-flex items-center gap-2">
          <span
            className="size-3 rounded-full"
            style={{ backgroundColor: CHART_METRIC_COLOR[CHART_METRIC.Volume] }}
          />
          Volume
        </span>
        <span>{formatAmount(point.volume)}</span>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-6">
        <span className="inline-flex items-center gap-2">
          <span
            className="size-3 rounded-full"
            style={{ backgroundColor: CHART_METRIC_COLOR[CHART_METRIC.Transaction] }}
          />
          Transaction
        </span>
        <span>{point.transaction}</span>
      </div>
    </div>
  );
}

export function PaymentsCard(props: {
  totalPayment: string;
  paymentCount: number;
  range: VolumePeriod;
  onRangeChange: (range: VolumePeriod) => void;
  metric: ChartMetric;
  onMetricChange: (metric: ChartMetric) => void;
  points: AdminOverviewChartPoint[];
}) {
  const {
    totalPayment,
    paymentCount,
    range,
    onRangeChange,
    metric,
    onMetricChange,
    points,
  } = props;
  const color = CHART_METRIC_COLOR[metric];
  const gradientId = useId().replaceAll(":", "");
  const fillId = `adminPaymentsFill-${gradientId}`;
  const hostRef = useRef<HTMLDivElement>(null);
  const [hostWidth, setHostWidth] = useState(0);
  const chartData = points.map((point) => ({
    ...point,
    value: metric === CHART_METRIC.Volume ? point.volume : point.transaction,
  }));
  const maxValue = chartData.reduce((max, point) => Math.max(max, point.value), 0);
  const yTicks = adminChartYTicks(maxValue, metric);
  const domain: [number, number] = [0, yTicks[yTicks.length - 1] ?? 0];
  const lastPoint = chartData[chartData.length - 1];
  const xTicks = useMemo(() => {
    const labels = points.map((point) => point.label);
    return evenCategoryTicks(labels, maxCategoryTicks(hostWidth, chartXTickMinPx(labels)));
  }, [hostWidth, points]);

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const update = () => {
      const next = el.clientWidth;
      setHostWidth((prev) => (prev === next ? prev : next));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Card className="flex min-h-[540px] flex-col">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <section>
          <h2 className="font-montserrat text-base font-medium capitalize text-black">
            Total Payment
          </h2>
          <p className="mt-2 font-montserrat text-[26px] font-medium text-black">
            {formatAmount(totalPayment)}
          </p>
        </section>
        <section>
          <h2 className="font-montserrat text-base font-medium capitalize text-black">
            Number of Payments
          </h2>
          <div className="mt-2 flex flex-wrap items-baseline gap-2">
            <p className="font-montserrat text-[26px] font-medium text-black">
              {paymentCount}
            </p>
            <Link to="/pay/history" className={OVERVIEW_LINK_CLASS}>
              View all →
            </Link>
          </div>
        </section>
      </div>

      <div className="mt-5 border-t border-black/10 pt-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="mr-auto font-montserrat text-base font-medium capitalize text-black">
            Payments
          </h2>
          <div className="flex h-[30px] items-center rounded-[18px] bg-[#f2f2f2] p-0.5">
            {CHART_METRIC_OPTIONS.map((option) => {
              const selected = option.value === metric;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onMetricChange(option.value)}
                  className={cn(
                    "h-[26px] rounded-[18px] px-3 font-montserrat text-xs font-medium text-black",
                    selected && "border border-[#e3e3e3] bg-white",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <Dropdown
            value={range}
            onChange={(value) => onRangeChange(value as VolumePeriod)}
            options={[...OVERVIEW_VOLUME_PERIOD_OPTIONS]}
            triggerClassName="h-[30px] w-[81px] rounded-[18px] border-black/10 bg-transparent px-2.5 text-xs shadow-none"
          />
        </div>
      </div>

      <div ref={hostRef} className="mt-4 min-h-0 min-w-0 flex-1">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: ADMIN_CHART_PLOT_RIGHT_MARGIN, left: 0, bottom: 4 }}
          >
            <defs>
              <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={OVERVIEW_CHART_GRID} />
            <XAxis
              dataKey="label"
              ticks={xTicks}
              interval={0}
              minTickGap={0}
              tickLine={false}
              axisLine={false}
              tick={<ChartXTick />}
            />
            <YAxis
              ticks={yTicks}
              domain={domain}
              allowDecimals={metric !== CHART_METRIC.Transaction}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => formatAdminChartAxis(value, metric)}
              tick={{ fill: "#aaa", fontSize: 12, fontFamily: "Montserrat" }}
              width={ADMIN_CHART_Y_AXIS_WIDTH}
            />
            <Tooltip
              cursor={{ stroke: color, strokeWidth: 1 }}
              content={<PaymentsTooltip />}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${fillId})`}
              fillOpacity={1}
              dot={false}
              activeDot={{ r: 5, stroke: color, fill: "#fff", strokeWidth: 2 }}
            />
            {lastPoint ? (
              <ReferenceDot
                x={lastPoint.label}
                y={lastPoint.value}
                r={5}
                fill="#fff"
                stroke={color}
                strokeWidth={2}
              />
            ) : null}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
