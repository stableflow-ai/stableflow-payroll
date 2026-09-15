import { cn } from "@/lib/utils";
import { useSafeAccountInfo } from "@/wallet/evm/safe";

/**
 * `Multisig m/n` next to the connected address. Renders nothing for an EOA, and
 * nothing until the on-chain read lands, so it never shows a placeholder count.
 */
export function SafeMultisigBadge({ className }: { className?: string }) {
  const info = useSafeAccountInfo();
  if (!info) return null;

  return (
    <span
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center rounded-[11px] border border-[#003bff]/25 bg-[#003bff]/8 px-2 font-montserrat text-[11px] font-medium text-[#003bff]",
        className,
      )}
      title={`Safe multisig requiring ${info.threshold} of ${info.owners.length} owners`}
    >
      Multisig {info.threshold}/{info.owners.length}
    </span>
  );
}
