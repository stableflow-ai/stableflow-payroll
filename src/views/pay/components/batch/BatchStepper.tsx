import { cn } from "@/lib/utils";

export function BatchStepper(props: { active: 1 | 2 }) {
  const { active } = props;
  return (
    <div className="flex items-center gap-2 font-montserrat text-sm font-medium">
      <StepBadge n={1} current={active} label="Validate" />
      <span className="h-px w-[80px] bg-[#d9d9d9]" />
      <StepBadge n={2} current={active} label="Preview & Confirm" />
    </div>
  );
}

function StepBadge(props: { n: 1 | 2; current: 1 | 2; label: string }) {
  const { n, current, label } = props;
  const on = n <= current;
  return (
    <div className="flex items-center gap-2">
      <span className={cn("relative inline-flex size-[22px] items-center justify-center", on && "size-[26px]")}>
        {on ? (
          <span className="absolute inset-0 rounded-full border border-[#4da0ff]" />
        ) : null}
        <span
          className={cn(
            "inline-flex size-[22px] items-center justify-center rounded-full text-sm",
            on ? "bg-[#4da0ff] text-white" : "bg-[#d9d9d9] text-[#aaa]",
          )}
        >
          {n}
        </span>
      </span>
      <span className={cn(on ? "text-black" : "text-[#aaa]")}>{label}</span>
    </div>
  );
}
