import { formatAmount } from "@/utils";

export function ChartTooltip(props: {
  active?: boolean;
  label?: string | number;
  value?: number | string | ReadonlyArray<number | string>;
  extra?: string | null;
}) {
  const { active, label, value, extra } = props;
  if (!active || value == null || typeof value !== "number") return null;

  return (
    <div className="rounded-[12px] bg-white px-3 py-2 font-montserrat shadow-[0_0_20px_rgba(0,0,0,0.06)]">
      {label != null ? <p className="text-xs text-[#909090]">{label}</p> : null}
      <p className="text-sm font-medium text-black">
        {formatAmount(value, { padDecimals: true })}
      </p>
      {extra ? <p className="mt-0.5 text-xs font-medium text-black">{extra}</p> : null}
    </div>
  );
}
