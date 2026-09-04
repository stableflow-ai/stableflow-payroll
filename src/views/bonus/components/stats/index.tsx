import { Card } from "@/components/ui/card/Card";
import { cn } from "@/lib/utils";
import { BONUS_CHANGE_UP_CLASS } from "../../config";
import { formatBonusTokenAmount } from "../../utils";

export type StatsCardProps = {
  totalBonus: string;
  totalBonusToken: string;
  totalChangePercent: number | null;
  members: number;
  membersChangePercent: number | null;
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
            hintTone === "up" ? BONUS_CHANGE_UP_CLASS : "text-[#aaa]",
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
    totalBonus,
    totalBonusToken,
    totalChangePercent,
    members,
    membersChangePercent,
  } = props;

  return (
    <Card className="grid grid-cols-1 gap-6 py-[22px] sm:grid-cols-2 sm:gap-8">
      <StatColumn
        label="Total Bonus"
        value={formatBonusTokenAmount(totalBonus, totalBonusToken)}
        hint="from last month"
        hintValue={formatChange(totalChangePercent)}
        hintTone={totalChangePercent == null ? "muted" : "up"}
      />
      <StatColumn
        label="Members"
        value={String(members)}
        hint="from last month"
        hintValue={formatChange(membersChangePercent)}
        hintTone={membersChangePercent == null ? "muted" : "up"}
      />
    </Card>
  );
}
