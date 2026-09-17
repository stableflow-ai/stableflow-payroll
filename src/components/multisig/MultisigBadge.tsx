import { cn } from "@/lib/utils";
import type { ChainKind } from "@/wallet/types";
import { useSafeAccountInfo } from "@/wallet/evm/safe";
import { useNearDaoInfo } from "@/wallet/near/multisig";
import { useSquadsAccountInfo } from "@/wallet/solana/multisig";

/**
 * `Multisig m/n` next to the connected address. Renders nothing for an EOA /
 * named account, and nothing until the on-chain read lands, so it never shows a
 * placeholder count.
 */
export function MultisigBadge({
  chainKind,
  className,
}: {
  chainKind: ChainKind;
  className?: string;
}) {
  if (chainKind === "evm") return <EvmMultisigBadge className={className} />;
  if (chainKind === "near") return <NearMultisigBadge className={className} />;
  if (chainKind === "solana") return <SolanaMultisigBadge className={className} />;
  return null;
}

function BadgeShell({
  className,
  title,
  threshold,
  of,
}: {
  className?: string;
  title: string;
  threshold: number;
  of: number;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center rounded-[11px] border border-[#003bff]/25 bg-[#003bff]/8 px-2 font-montserrat text-[11px] font-medium text-[#003bff]",
        className,
      )}
      title={title}
    >
      Multisig {threshold}/{of}
    </span>
  );
}

function EvmMultisigBadge({ className }: { className?: string }) {
  const info = useSafeAccountInfo();
  if (!info) return null;
  return (
    <BadgeShell
      className={className}
      title={`Safe multisig requiring ${info.threshold} of ${info.owners.length} owners`}
      threshold={info.threshold}
      of={info.owners.length}
    />
  );
}

function NearMultisigBadge({ className }: { className?: string }) {
  const info = useNearDaoInfo();
  if (!info) return null;
  return (
    <BadgeShell
      className={className}
      title={`SputnikDAO multisig requiring ${info.threshold} of ${info.members.length} members`}
      threshold={info.threshold}
      of={info.members.length}
    />
  );
}

function SolanaMultisigBadge({ className }: { className?: string }) {
  const info = useSquadsAccountInfo();
  if (!info) return null;
  return (
    <BadgeShell
      className={className}
      title={`Squads treasury requiring ${info.threshold} of ${info.members.length} members`}
      threshold={info.threshold}
      of={info.members.length}
    />
  );
}
