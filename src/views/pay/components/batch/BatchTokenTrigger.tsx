import { IconArrowDown } from "@/components/icons/arrow-down";
import { cn } from "@/lib/utils";
import type { IntentsToken } from "@/stores/intents-tokens";
import { formatTokenNetwork } from "../../batch-utils";

export function BatchTokenTrigger(props: {
  token: IntentsToken | null;
  onClick: () => void;
  showLogo?: boolean;
  invalid?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const { token, onClick, showLogo = false, invalid = false, placeholder = "Select", className } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 min-w-0 w-full items-center gap-2 rounded-[6px] border bg-white px-3 font-montserrat text-sm font-medium outline-none",
        invalid ? "border-danger text-danger" : "border-[#e3e3e3] text-black",
        className,
      )}
    >
      {token && showLogo ? (
        <img src={token.logo} alt="" className="size-4 shrink-0 rounded-full object-cover" />
      ) : null}
      <span className="min-w-0 flex-1 truncate text-left">
        {token ? formatTokenNetwork(token) : placeholder}
      </span>
      <IconArrowDown className="h-1 w-2.5 shrink-0 text-black/60" />
    </button>
  );
}
