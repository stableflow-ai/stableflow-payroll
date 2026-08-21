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
import { formatAmount } from "@/utils";
import type { VolumePoint, VolumeRange } from "@/mocks/home";
import { HOME_CHART_LINE_COLOR, VOLUME_RANGE_OPTIONS } from "../config";

function formatVolumeTick(value: number) {
  if (value === 0) return "$0";
  if (Math.abs(value) >= 1000) return `$${value / 1000}K`;
  return formatAmount(value);
}

function VolumeTooltip({
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

export function PaymentVolumeCard({
  range,
  onRangeChange,
  points,
}: {
  range: VolumeRange;
  onRangeChange: (range: VolumeRange) => void;
  points: VolumePoint[];
}) {
  return (
    <Card className="flex min-h-[388px] flex-col">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-montserrat text-base font-medium capitalize text-black">
          Payment Volume
        </h2>
        <Dropdown
          value={range}
          onChange={(value) => onRangeChange(value as VolumeRange)}
          options={VOLUME_RANGE_OPTIONS}
          triggerClassName="h-9 w-[118px] rounded-[18px] border-black/10 bg-transparent px-4"
        />
      </div>
      <div className="mt-4 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
              tickFormatter={formatVolumeTick}
              tick={{ fill: "#aaa", fontSize: 12, fontFamily: "Montserrat" }}
              width={48}
            />
            <Tooltip
              content={(props) => (
                <VolumeTooltip
                  active={props.active}
                  payload={props.payload}
                  label={props.label}
                />
              )}
              cursor={{ stroke: "#4DA0FF", strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={HOME_CHART_LINE_COLOR}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: HOME_CHART_LINE_COLOR, stroke: "#fff", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
