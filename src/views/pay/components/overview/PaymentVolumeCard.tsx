import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card/Card";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { formatAmount } from "@/utils";
import type { VolumePeriod } from "@/types/payout";
import type { EmployeeOverviewVolumePoint } from "@/hooks/use-employee-overview-api";
import {
  OVERVIEW_CHART_GRID,
  OVERVIEW_INCOME_COLOR,
  OVERVIEW_PAYOUT_COLOR,
  OVERVIEW_VOLUME_PERIOD_OPTIONS,
} from "./config";
import { formatVolumeAxis } from "./utils";

function VolumeTooltip(props: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: EmployeeOverviewVolumePoint }>;
}) {
  const point = props.payload?.[0]?.payload;
  if (!props.active || !point) return null;

  return (
    <div className="w-[258px] rounded-[12px] border border-[#e0e0e0] bg-[#fdfdfd] px-4 py-3.5 font-montserrat text-xs font-medium text-[#606060] shadow-[0_0_20px_0_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-full" style={{ backgroundColor: OVERVIEW_INCOME_COLOR }} />
          Income
        </span>
        <span>{formatAmount(point.income)}</span>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-3">
        <span>Number of Income Tx</span>
        <span>{point.incomeTx}</span>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-full" style={{ backgroundColor: OVERVIEW_PAYOUT_COLOR }} />
          Payout
        </span>
        <span>{formatAmount(point.payout)}</span>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-3">
        <span>Number of Payout Tx</span>
        <span>{point.payoutTx}</span>
      </div>
    </div>
  );
}

export function PaymentVolumeCard(props: {
  range: VolumePeriod;
  onRangeChange: (range: VolumePeriod) => void;
  points: EmployeeOverviewVolumePoint[];
}) {
  const { range, onRangeChange, points } = props;

  return (
    <Card className="flex min-h-[454px] flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-montserrat text-base font-medium capitalize text-black">
          Payment Volume
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5 font-montserrat text-xs font-medium text-[#606060]">
            <span className="size-3 rounded-full" style={{ backgroundColor: OVERVIEW_INCOME_COLOR }} />
            Income
          </span>
          <span className="inline-flex items-center gap-1.5 font-montserrat text-xs font-medium text-[#606060]">
            <span className="size-3 rounded-full" style={{ backgroundColor: OVERVIEW_PAYOUT_COLOR }} />
            Payout
          </span>
          <Dropdown
            value={range}
            onChange={(value) => onRangeChange(value as VolumePeriod)}
            options={[...OVERVIEW_VOLUME_PERIOD_OPTIONS]}
            triggerClassName="h-9 w-[118px] rounded-[18px] border-black/10 bg-transparent px-4"
          />
        </div>
      </div>
      <div className="mt-4 h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
            <CartesianGrid vertical={false} stroke={OVERVIEW_CHART_GRID} />
            <CartesianGrid horizontal={false} stroke={OVERVIEW_CHART_GRID} strokeDasharray="4 4" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#aaa", fontSize: 12, fontFamily: "Montserrat" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={formatVolumeAxis}
              tick={{ fill: "#aaa", fontSize: 12, fontFamily: "Montserrat" }}
              width={44}
              domain={[0, (dataMax: number) => (dataMax > 0 ? dataMax : 5000)]}
            />
            <Tooltip
              cursor={{ fill: "rgba(63,138,251,0.2)" }}
              content={<VolumeTooltip />}
            />
            <Bar dataKey="income" fill={OVERVIEW_INCOME_COLOR} maxBarSize={37} />
            <Bar dataKey="payout" fill={OVERVIEW_PAYOUT_COLOR} maxBarSize={37} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
