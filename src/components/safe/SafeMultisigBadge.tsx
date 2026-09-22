import { MultisigBadge } from "@/components/multisig/MultisigBadge";

/**
 * `Multisig m/n` next to a connected Safe. Thin wrapper over MultisigBadge.
 */
export function SafeMultisigBadge({ className }: { className?: string }) {
  return <MultisigBadge chainKind="evm" className={className} />;
}
