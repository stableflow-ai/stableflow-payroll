import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card/Card";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/utils";
import type { BonusChartPoint } from "@/mocks/bonus";
import {
  BONUS_CHART_HIGHLIGHT_COLOR,
  BONUS_CHART_LINE_COLOR,
  BONUS_CHART_RANGE_OPTIONS,
  BONUS_CHART_Y_MAX,
  type BonusChartRange,
} from "../../config";

function formatYTick(value: number) {
  if (value === 0) return "$0";
  if (Math.abs(value) >= 1000) return `$${value / 1000}K`;
  return formatAmount(value, { prefix: "" });
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
}) {
  const { range, onRangeChange, periodLabel, currentValue, points } = props;
  const isEmpty = points.every((point) => point.value === 0);
  const yMax = Math.max(BONUS_CHART_Y_MAX, ...points.map((point) => point.value));
  const highlightedLabel = points.find((point) => point.highlighted)?.label;

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
              {currentValue}
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
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e3e3e3" />
            <defs>
              <linearGradient id="bonusChartHighlight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={BONUS_CHART_HIGHLIGHT_COLOR} stopOpacity={0.2} />
                <stop offset="100%" stopColor={BONUS_CHART_HIGHLIGHT_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={(tickProps) => {
                const { x, y, payload } = tickProps;
                const active = payload?.value === highlightedLabel;
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
              ticks={[0, yMax / 3, (yMax * 2) / 3, yMax]}
              tickFormatter={formatYTick}
              tick={{ fill: "#aaa", fontSize: 12, fontFamily: "Montserrat" }}
              width={48}
            />
            {highlightedLabel ? (
              <ReferenceArea
                x1={highlightedLabel}
                x2={highlightedLabel}
                fill="url(#bonusChartHighlight)"
                ifOverflow="extendDomain"
              />
            ) : null}
            <Tooltip
              content={(tooltipProps) => (
                <ChartTooltip
                  active={tooltipProps.active}
                  payload={tooltipProps.payload}
                  label={tooltipProps.label}
                />
              )}
              cursor={{ stroke: BONUS_CHART_LINE_COLOR, strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            <Line
              type="linear"
              dataKey="value"
              stroke={BONUS_CHART_LINE_COLOR}
              strokeWidth={2}
              dot={{
                r: 6,
                fill: BONUS_CHART_LINE_COLOR,
                stroke: "#fff",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 6,
                fill: BONUS_CHART_LINE_COLOR,
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
