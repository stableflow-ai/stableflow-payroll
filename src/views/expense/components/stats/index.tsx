import { IconLoading } from "@/components/icons/loading";
import { Card } from "@/components/ui/card/Card";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/utils";
import {
  EXPENSE_CHANGE_DOWN_CLASS,
  EXPENSE_CHANGE_UP_CLASS,
} from "../../config";

export type StatsCardProps = {
  loading?: boolean;
  error?: string | null;
  totalExpense: string;
  totalChangePercent: number | null;
  expensedCount: number;
  expensedChangePercent: number | null;
  expenseCount: number;
  expenseChangePercent: number | null;
};

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
  hint: string;
  hintValue: string;
  hintTone?: "muted" | "up" | "down";
}) {
  const { label, value, hint, hintValue, hintTone = "muted" } = props;
  return (
    <div className="min-w-0">
      <p className="font-montserrat text-sm font-medium capitalize text-[#606060]">
        {label}
      </p>
      <p className="mt-1.5 font-montserrat text-[20px] font-semibold capitalize text-black">
        {value}
      </p>
      <p className="mt-1.5 font-montserrat text-xs leading-none">
        <span
          className={cn(
            "font-medium",
            hintTone === "up" && EXPENSE_CHANGE_UP_CLASS,
            hintTone === "down" && EXPENSE_CHANGE_DOWN_CLASS,
            hintTone === "muted" && "text-[#aaa]",
          )}
        >
          {hintValue}
        </span>{" "}
        <span className="font-normal text-[#aaa]">{hint}</span>
      </p>
    </div>
  );
}

export function StatsCard(props: StatsCardProps) {
  const {
    loading = false,
    error = null,
    totalExpense,
    totalChangePercent,
    expensedCount,
    expensedChangePercent,
    expenseCount,
    expenseChangePercent,
  } = props;

  return (
    <Card className="grid grid-cols-1 gap-6 py-[22px] sm:grid-cols-3 sm:gap-8">
      {loading ? (
        <div className="flex min-h-[88px] items-center justify-center sm:col-span-3">
          <IconLoading className="size-5 animate-spin text-[#909090]" />
        </div>
      ) : error ? (
        <p className="font-montserrat text-sm text-danger sm:col-span-3">{error}</p>
      ) : (
        <>
          <StatColumn
            label="Total expense"
            value={formatAmount(totalExpense)}
            hint="from last month"
            hintValue={formatChange(totalChangePercent)}
            hintTone={changeTone(totalChangePercent)}
          />
          <StatColumn
            label="Number of expensed"
            value={String(expensedCount)}
            hint="from last month"
            hintValue={formatChange(expensedChangePercent)}
            hintTone={changeTone(expensedChangePercent)}
          />
          <StatColumn
            label="Number of expenses"
            value={String(expenseCount)}
            hint="from last month"
            hintValue={formatChange(expenseChangePercent)}
            hintTone={changeTone(expenseChangePercent)}
          />
        </>
      )}
    </Card>
  );
}
