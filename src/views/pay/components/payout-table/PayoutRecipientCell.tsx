import { IconCopy } from "@/components/icons/copy";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import useToast from "@/hooks/use-toast";
import { formatAddress } from "@/utils";

export function PayoutRecipientCell({
  address,
  prefix = 4,
  suffix = 5,
}: {
  address: string;
  prefix?: number;
  suffix?: number;
}) {
  const toast = useToast();

  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <Tooltip content={address} triggerClassName="min-w-0">
        <span className="truncate">{formatAddress(address, prefix, suffix)}</span>
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
