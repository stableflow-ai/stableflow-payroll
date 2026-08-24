import { IconCopy } from "@/components/icons/copy";
import useToast from "@/hooks/use-toast";
import { formatAddress } from "@/utils";

export function PayoutRecipientCell({ address }: { address: string }) {
  const toast = useToast();

  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <span className="truncate">{formatAddress(address)}</span>
      <button
        type="button"
        className="shrink-0 text-[#909090] hover:text-black"
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
