import { Card } from "@/components/ui/card/Card";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/utils";
import { PAYROLL_CHANGE_UP_CLASS } from "../../config";

export type StatsCardProps = {
  totalThisMonth: string;
  totalChangePercent: number | null;
  recipients: number;
  recipientsChangePercent: number | null;
  averageSalary: string;
  maximumSalary: string;
};

function formatChange(value: number | null) {
  if (value == null) return "-%";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value}%`;
}

function StatColumn(props: {
  label: string;
  value: string;
  hint: string;
  hintValue: string;
  hintTone?: "muted" | "up";
}) {
  const { label, value, hint, hintValue, hintTone = "muted" } = props;
  return (
    <div className="min-w-0">
      <p className="font-montserrat text-sm font-medium text-[#606060]">{label}</p>
      <p className="mt-1.5 font-montserrat text-[20px] font-semibold capitalize text-black">
        {value}
      </p>
      <p className="mt-1.5 font-montserrat text-xs leading-none">
        <span
          className={cn(
            "font-medium",
            hintTone === "up" ? PAYROLL_CHANGE_UP_CLASS : "text-[#aaa]",
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
    totalThisMonth,
    totalChangePercent,
    recipients,
    recipientsChangePercent,
    averageSalary,
    maximumSalary,
  } = props;

  return (
    <Card className="grid grid-cols-1 gap-6 py-[22px] sm:grid-cols-3 sm:gap-8">
      <StatColumn
        label="Total Payroll This Month"
        value={formatAmount(totalThisMonth)}
        hint="from last month"
        hintValue={formatChange(totalChangePercent)}
        hintTone={totalChangePercent == null ? "muted" : "up"}
      />
      <StatColumn
        label="Total Recipients"
        value={String(recipients)}
        hint="from last month"
        hintValue={formatChange(recipientsChangePercent)}
        hintTone={recipientsChangePercent == null ? "muted" : "up"}
      />
      <StatColumn
        label="Average Salary"
        value={formatAmount(averageSalary)}
        hint="Maximum salary"
        hintValue={formatAmount(maximumSalary)}
      />
    </Card>
  );
}
