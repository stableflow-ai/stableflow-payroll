import { IconCopy } from "@/components/icons/copy";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import useToast from "@/hooks/use-toast";
import { formatAddress } from "@/utils";
import { TEAM_WALLET_DISPLAY_PREFIX, TEAM_WALLET_DISPLAY_SUFFIX } from "./config";
import { dash } from "./utils";

export function TeamWalletCell({ address }: { address: string | null }) {
  const toast = useToast();
  if (!address) {
    return <span>{dash("")}</span>;
  }

  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <Tooltip content={address} triggerClassName="min-w-0">
        <span className="truncate">
          {formatAddress(address, TEAM_WALLET_DISPLAY_PREFIX, TEAM_WALLET_DISPLAY_SUFFIX)}
        </span>
      </Tooltip>
      <button
        type="button"
        className="shrink-0 cursor-pointer text-[#909090] hover:text-black"
        aria-label="Copy address"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(address);
            toast.success({ title: "Copied" });
          } catch {
            toast.fail({ title: "Could not copy" });
          }
        }}
      >
        <IconCopy className="size-3" />
      </button>
    </span>
  );
}
