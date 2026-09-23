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
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { Card } from "@/components/ui/card/Card";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { cn } from "@/lib/utils";
import type { BonusChartPoint } from "@/types/bonus";
import { formatAmount, chartYTicks } from "@/utils";
import {
  BONUS_CHART_LINE_COLOR,
  BONUS_CHART_RANGE_OPTIONS,
  type BonusChartRange,
} from "../../config";

function formatYTick(value: number) {
  if (value === 0) return "$0";
  if (Math.abs(value) >= 1000) return `$${value / 1000}K`;
  return formatAmount(value);
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

export function TotalBonusChart(props: {
  range: BonusChartRange;
  onRangeChange: (range: BonusChartRange) => void;
  periodLabel: string;
  currentValue: string;
  points: BonusChartPoint[];
  loading?: boolean;
  error?: string | null;
}) {
  const {
    range,
    onRangeChange,
    periodLabel,
    currentValue,
    points,
    loading = false,
    error = null,
  } = props;
  const isEmpty = !loading && points.every((point) => point.value === 0);
  const yTicks = chartYTicks(Math.max(0, ...points.map((point) => point.value)), 3);
  const yMax = yTicks[yTicks.length - 1] ?? 1;
  const lastPoint = points.length > 0 ? points[points.length - 1] : null;

  return (
    <Card className="flex min-h-[454px] flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-montserrat text-base font-medium capitalize text-black">
            Total Bonus
          </h2>
          <p className="mt-2 flex flex-wrap items-baseline gap-1.5">
            <span
              className={cn(
                "font-montserrat text-[20px] font-semibold capitalize text-black",
                isEmpty && "opacity-30",
              )}
            >
              {formatAmount(currentValue)}
            </span>
            <span className="font-montserrat text-xs font-normal text-[#aaa]">
              {periodLabel}
            </span>
          </p>
        </div>
        <Dropdown
          value={range}
          onChange={(value) => onRangeChange(value as BonusChartRange)}
          options={[...BONUS_CHART_RANGE_OPTIONS]}
          triggerClassName="h-9 w-[135px] rounded-[18px] border-black/10 bg-transparent px-4 text-xs text-[#606060]"
        />
      </div>
      <div className="mt-4 h-[320px]">
        {loading ? (
          <Skeleton className="h-full w-full" />
        ) : error ? (
          <div className="flex h-full items-center justify-center">
            <p className="font-montserrat text-sm text-danger">{error}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id="bonusChartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BONUS_CHART_LINE_COLOR} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={BONUS_CHART_LINE_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#e3e3e3" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#aaa", fontSize: 12, fontFamily: "Montserrat" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                domain={[0, yMax]}
                ticks={yTicks}
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
                cursor={{ stroke: BONUS_CHART_LINE_COLOR, strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={BONUS_CHART_LINE_COLOR}
                strokeWidth={2}
                fill="url(#bonusChartFill)"
                fillOpacity={1}
                dot={false}
                activeDot={{ r: 5, stroke: BONUS_CHART_LINE_COLOR, fill: "#fff", strokeWidth: 2 }}
              />
              {lastPoint ? (
                <ReferenceDot
                  x={lastPoint.label}
                  y={lastPoint.value}
                  r={5}
                  fill="#fff"
                  stroke={BONUS_CHART_LINE_COLOR}
                  strokeWidth={2}
                />
              ) : null}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
