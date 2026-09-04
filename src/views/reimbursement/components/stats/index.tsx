import { Card } from "@/components/ui/card/Card";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/utils";
import {
  REIMBURSEMENT_CHANGE_DOWN_CLASS,
  REIMBURSEMENT_CHANGE_UP_CLASS,
} from "../../config";

export type StatsCardProps = {
  totalReimbursement: string;
  totalChangePercent: number | null;
  reimbursedCount: number;
  reimbursedChangePercent: number | null;
  reimbursementCount: number;
  reimbursementChangePercent: number | null;
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
            hintTone === "up" && REIMBURSEMENT_CHANGE_UP_CLASS,
            hintTone === "down" && REIMBURSEMENT_CHANGE_DOWN_CLASS,
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
    totalReimbursement,
    totalChangePercent,
    reimbursedCount,
    reimbursedChangePercent,
    reimbursementCount,
    reimbursementChangePercent,
  } = props;

  return (
    <Card className="grid grid-cols-1 gap-6 py-[22px] sm:grid-cols-3 sm:gap-8">
      <StatColumn
        label="Total reimbursement"
        value={formatAmount(totalReimbursement)}
        hint="from last month"
        hintValue={formatChange(totalChangePercent)}
        hintTone={changeTone(totalChangePercent)}
      />
      <StatColumn
        label="Number of reimbursed"
        value={String(reimbursedCount)}
        hint="from last month"
        hintValue={formatChange(reimbursedChangePercent)}
        hintTone={changeTone(reimbursedChangePercent)}
      />
      <StatColumn
        label="Number of reimbursements"
        value={String(reimbursementCount)}
        hint="from last month"
        hintValue={formatChange(reimbursementChangePercent)}
        hintTone={changeTone(reimbursementChangePercent)}
      />
    </Card>
  );
}
