import { cn } from "@/lib/utils";

export function CountBadge(props: { count: number; className?: string }) {
  const { count, className } = props;
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-[8px] bg-[#06f] px-0.5 font-montserrat text-[12px] font-medium leading-none text-white",
        className,
      )}
    >
      {count}
    </span>
  );
}
