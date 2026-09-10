import { IconLoading } from "@/components/icons/loading";
import { Card } from "@/components/ui/card/Card";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/utils";

const CHANGE_UP_CLASS = "text-[#0ED000]";
const CHANGE_DOWN_CLASS = "text-[#E43222]";

function formatChange(value: number | null) {
  if (value == null) return "-%";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}%`;
}

function changeTone(value: number | null): "muted" | "up" | "down" {
  if (value == null || value === 0) return "muted";
  return value > 0 ? "up" : "down";
}

function StatColumn(props: {
  label: string;
  value: string;
  hintValue: string;
  hintTone?: "muted" | "up" | "down";
}) {
  const { label, value, hintValue, hintTone = "muted" } = props;
  return (
    <div className="min-w-0">
      <p className="font-montserrat text-sm font-medium capitalize text-[#606060]">{label}</p>
      <p className="mt-1.5 font-montserrat text-[20px] font-semibold capitalize text-black">
        {value}
      </p>
      <p className="mt-1.5 font-montserrat text-xs leading-none">
        <span
          className={cn(
            "font-medium",
            hintTone === "up" && CHANGE_UP_CLASS,
            hintTone === "down" && CHANGE_DOWN_CLASS,
            hintTone === "muted" && "text-[#aaa]",
          )}
        >
          {hintValue}
        </span>{" "}
        <span className="font-normal text-[#aaa]">from last month</span>
      </p>
    </div>
  );
}

export function OperationStatsCard(props: {
  loading?: boolean;
  error?: string | null;
  totalPayout: string;
  totalChangePercent: number | null;
  payouts: number;
  payoutsChangePercent: number | null;
}) {
  const {
    loading = false,
    error = null,
    totalPayout,
    totalChangePercent,
    payouts,
    payoutsChangePercent,
  } = props;

  return (
    <Card className="grid grid-cols-1 gap-6 px-10 py-[22px] sm:grid-cols-2 sm:gap-8">
      {loading ? (
        <div className="flex min-h-[88px] items-center justify-center sm:col-span-2">
          <IconLoading className="size-5 animate-spin text-[#909090]" />
        </div>
      ) : error ? (
        <p className="font-montserrat text-sm text-danger sm:col-span-2">{error}</p>
      ) : (
        <>
          <StatColumn
            label="Total Payment"
            value={formatAmount(totalPayout)}
            hintValue={formatChange(totalChangePercent)}
            hintTone={changeTone(totalChangePercent)}
          />
          <StatColumn
            label="Number of payments"
            value={String(payouts)}
            hintValue={formatChange(payoutsChangePercent)}
            hintTone={changeTone(payoutsChangePercent)}
          />
        </>
      )}
    </Card>
  );
}
