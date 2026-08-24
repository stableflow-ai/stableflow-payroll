import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card/Card";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { formatAmount } from "@/utils";
import { type VolumePeriod } from "@/types/payout";
import { cn } from "@/lib/utils";
import {
  CHANGE_DOWN_BG,
  CHANGE_UP_BG,
  CHART_BAR_ACTIVE,
  CHART_BAR_MUTED,
  VOLUME_PERIOD_OPTIONS,
  type AnalyticsVolumePoint,
} from "../config";
import { ChartTooltip } from "./ChartTooltip";

function formatCompactUsd(value: number) {
  if (value === 0) return "$0";
  if (Math.abs(value) >= 1000) {
    const k = value / 1000;
    const text = Number.isInteger(k) ? String(k) : k.toFixed(1);
    return `$${text}K`;
  }
  return formatAmount(value);
}

function formatYTick(value: number) {
  if (value === 0) return "$0";
  if (Math.abs(value) >= 1000) return `$${value / 1000}K`;
  return formatAmount(value);
}

function formatChange(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}%`;
}

function BarTopLabel(props: {
  x?: number;
  y?: number;
  width?: number;
  index?: number;
  visible?: boolean;
  points: AnalyticsVolumePoint[];
}) {
  const { x = 0, y = 0, width = 0, index = 0, visible, points } = props;
  if (!visible) return null;
  const point = points[index];
  if (!point) return null;
  const cx = x + width / 2;
  const change = point.changePercent;
  const up = change != null && change >= 0;

  return (
    <g>
      <text
        x={cx}
        y={y - 32}
        textAnchor="middle"
        className="fill-black font-montserrat text-[14px] font-medium"
      >
        {formatCompactUsd(point.value)}
      </text>
      {change != null ? (
        <>
          <rect
            x={cx - 23.5}
            y={y - 26}
            width={47}
            height={26}
            rx={13}
            fill={up ? CHANGE_UP_BG : CHANGE_DOWN_BG}
          />
          <text
            x={cx}
            y={y - 8}
            textAnchor="middle"
            className={cn(
              "font-montserrat text-[12px] font-medium",
              up ? "fill-black" : "fill-white",
            )}
          >
            {formatChange(change)}
          </text>
        </>
      ) : null}
    </g>
  );
}

export function TotalPaymentCard(props: {
  totalPaymentUsd: string | number | null;
  totalPayouts: number | null;
  recipients: number | null;
  range: VolumePeriod;
  onRangeChange: (range: VolumePeriod) => void;
  points: AnalyticsVolumePoint[];
  showBarLabels: boolean;
}) {
  const {
    totalPaymentUsd,
    totalPayouts,
    recipients,
    range,
    onRangeChange,
    points,
    showBarLabels,
  } = props;

  return (
    <Card className="flex min-h-[475px] flex-col">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <section>
          <h2 className="font-montserrat text-base font-medium capitalize text-black">
            Total Payment
          </h2>
          <p
            className={cn(
              "mt-2 font-montserrat text-[26px] font-medium text-black",
              totalPaymentUsd == null && "opacity-30",
            )}
          >
            {totalPaymentUsd == null
              ? "$-"
              : formatAmount(totalPaymentUsd, { padDecimals: true })}
          </p>
        </section>
        <section>
          <h2 className="font-montserrat text-base font-medium capitalize text-black">
            Total Payouts
          </h2>
          <p
            className={cn(
              "mt-2 font-montserrat text-[26px] font-medium text-black",
              totalPayouts == null && "opacity-30",
            )}
          >
            {totalPayouts == null ? "-" : totalPayouts}
          </p>
        </section>
        <section>
          <h2 className="font-montserrat text-base font-medium capitalize text-black">
            Recipients
          </h2>
          <p
            className={cn(
              "mt-2 font-montserrat text-[26px] font-medium text-black",
              recipients == null && "opacity-30",
            )}
          >
            {recipients == null ? "-" : recipients}
          </p>
        </section>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-black/10 pt-4">
        <h2 className="font-montserrat text-base font-medium capitalize text-black">
          Total Payment
        </h2>
        <Dropdown
          value={range}
          onChange={(value) => onRangeChange(value as VolumePeriod)}
          options={[...VOLUME_PERIOD_OPTIONS]}
          triggerClassName="h-9 w-[118px] rounded-[18px] border-black/10 bg-transparent px-4"
        />
      </div>

      <div className="mt-4 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} margin={{ top: showBarLabels ? 48 : 8, right: 8, left: 0, bottom: 0 }}>
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
              tickFormatter={formatYTick}
              tick={{ fill: "#aaa", fontSize: 12, fontFamily: "Montserrat" }}
              width={48}
            />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
              content={(tooltipProps) => {
                const item = tooltipProps.payload?.[0]?.payload as AnalyticsVolumePoint | undefined;
                const change = item?.changePercent;
                return (
                  <ChartTooltip
                    active={tooltipProps.active}
                    label={tooltipProps.label}
                    value={item?.value}
                    extra={change == null ? null : formatChange(change)}
                  />
                );
              }}
            />
            <Bar dataKey="value" radius={[12, 12, 12, 12]} maxBarSize={60}>
              {points.map((_, index) => (
                <Cell
                  key={points[index]?.label ?? index}
                  fill={index === points.length - 1 ? CHART_BAR_ACTIVE : CHART_BAR_MUTED}
                />
              ))}
              <LabelList
                dataKey="value"
                content={(labelProps) => (
                  <BarTopLabel
                    x={typeof labelProps.x === "number" ? labelProps.x : undefined}
                    y={typeof labelProps.y === "number" ? labelProps.y : undefined}
                    width={typeof labelProps.width === "number" ? labelProps.width : undefined}
                    index={labelProps.index}
                    visible={showBarLabels}
                    points={points}
                  />
                )}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
