import type { ReactNode } from "react";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { Switch } from "@/components/ui/switch/Switch";
import type { ChannelConfig } from "@/hooks/use-settings-api";
import { cn } from "@/lib/utils";
import { FIELD_REQUIREMENT_OPTIONS } from "./config";

export function IntegrationChannelCard(props: {
  title: string;
  icon?: ReactNode;
  config: ChannelConfig;
  locked?: boolean;
  onChange: (patch: Partial<ChannelConfig>) => void;
}) {
  const { title, icon, config, locked = false, onChange } = props;
  const dropdownDisabled = locked || !config.enabled;

  return (
    <div className="flex h-[103px] w-full max-w-[275px] flex-col rounded-[12px] border border-white bg-[#fdfdfd] px-4 py-4 shadow-[0_0_20px_0_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-2.5">
        {icon ? (
          <span className="inline-flex size-5 shrink-0 items-center justify-center overflow-clip text-[#606060]">
            {icon}
          </span>
        ) : null}
        <p className="min-w-0 flex-1 truncate font-montserrat text-sm font-medium text-[#606060]">
          {title}
        </p>
        {locked ? null : (
          <Switch
            checked={config.enabled}
            onCheckedChange={(enabled) => onChange({ enabled })}
          />
        )}
      </div>
      {locked ? (
        <p className="mt-auto flex h-9 items-center rounded-[8px] px-3 font-montserrat text-sm font-normal text-[#909090]">
          Required
        </p>
      ) : (
        <Dropdown
          value={config.requirement}
          disabled={dropdownDisabled}
          onChange={(value) => onChange({ requirement: value as ChannelConfig["requirement"] })}
          options={[...FIELD_REQUIREMENT_OPTIONS]}
          className="mt-auto w-full"
          triggerClassName={cn(
            "w-full rounded-[8px] border-black/10 bg-transparent font-normal text-[#909090] shadow-none",
            dropdownDisabled && "opacity-100",
          )}
        />
      )}
    </div>
  );
}

export function integrationIconImg(src: string, alt: string) {
  return <img src={src} alt={alt} className="size-5 object-contain" />;
}
