import { IconAlert } from "@/components/icons/alert";
import { IconCheck } from "@/components/icons/check";
import { cn } from "@/lib/utils";

export function BatchFieldStatus(props: { ok: boolean }) {
  const { ok } = props;
  return (
    <span
      className={cn(
        "inline-flex size-[22px] shrink-0 items-center justify-center rounded-full",
        ok ? "bg-[#22c55e]/15 text-[#16a34a]" : "bg-danger/15 text-danger",
      )}
    >
      {ok ? <IconCheck className="size-2.5" /> : <IconAlert className="h-[7px] w-0.5" />}
    </span>
  );
}
