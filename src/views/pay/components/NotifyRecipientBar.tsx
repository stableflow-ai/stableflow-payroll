import { Switch } from "@/components/ui/switch/Switch";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function NotifyRecipientBar(props: {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const { enabled, onEnabledChange, disabled = false, className, children } = props;
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <label className="flex min-w-0 items-center gap-2">
        <Switch
          checked={enabled}
          disabled={disabled}
          onCheckedChange={onEnabledChange}
          aria-label="Notify Recipient"
        />
        <span className="font-montserrat text-sm font-medium text-[#606060]">
          Notify Recipient
        </span>
      </label>
      {enabled ? children : null}
    </div>
  );
}
