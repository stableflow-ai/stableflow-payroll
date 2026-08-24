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
import { formatAmount } from "@/utils";

function formatVolumeTick(value: number) {
  if (value === 0) return "$0";
  if (Math.abs(value) >= 1000) return `$${value / 1000}K`;
  return formatAmount(value);
}

function ChartTooltip(props: {
  active?: boolean;
  payload?: ReadonlyArray<{ value?: number | string | ReadonlyArray<number | string> }>;
  label?: string | number;
  currency: boolean;
}) {
  const { active, payload, label, currency } = props;
  const value = payload?.[0]?.value;
  if (!active || value == null || typeof value !== "number") return null;
  return (
    <div className="rounded-[12px] bg-white px-3 py-2 font-montserrat shadow-[0_0_20px_rgba(0,0,0,0.06)]">
      <p className="text-xs text-[#909090]">{label}</p>
      <p className="text-sm font-medium text-black">
        {currency ? formatAmount(value, { padDecimals: true }) : value}
      </p>
    </div>
  );
}

export function ReportsLineChart(props: {
  title: string;
  points: Array<{ label: string; value: number }>;
  color: string;
  currency?: boolean;
}) {
  const { title, points, color, currency = false } = props;

  return (
    <Card className="flex min-h-[320px] flex-col lg:min-h-[398px]">
      <h2 className="font-montserrat text-base font-medium text-black">{title}</h2>
      <div className="mt-4 h-[240px] lg:h-[300px]">
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
              allowDecimals={currency}
              tickFormatter={currency ? formatVolumeTick : (value: number) => String(value)}
              tick={{ fill: "#aaa", fontSize: 12, fontFamily: "Montserrat" }}
              width={48}
            />
            <Tooltip
              content={(tooltipProps) => (
                <ChartTooltip
                  active={tooltipProps.active}
                  payload={tooltipProps.payload}
                  label={tooltipProps.label}
                  currency={currency}
                />
              )}
              cursor={{ stroke: color, strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: color, stroke: "#fff", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
