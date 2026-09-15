import { safeQueueUrl } from "@/config/chains";
import { useSafePendingPayoutStore } from "@/stores/safe-pending-payout";

/**
 * App-wide reminder that a payout is sitting in a Safe queue.
 *
 * Without it a payer who proposes a transaction and navigates away has no trace of
 * the payout they started, and it is the owners in Safe{Wallet} — not this page —
 * who have to act next.
 */
export function SafePendingBanner() {
  const items = useSafePendingPayoutStore((state) => state.items);
  if (items.length === 0) return null;

  const first = items[0];
  const queueUrl = safeQueueUrl(first.chainId, first.safeAddress);
  const label = items.length === 1
    ? `${first.title || "A payout"} is waiting for ${first.threshold} signatures in your Safe.`
    : `${items.length} payouts are waiting for signatures in your Safe.`;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[#d0f348] bg-[rgba(208,243,72,0.2)] px-4 py-3">
      <p className="font-montserrat text-sm text-[#5f7500]">{label}</p>
      {queueUrl ? (
        <a
          href={queueUrl}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 font-montserrat text-sm font-medium text-[#003bff]"
        >
          Open Safe queue
        </a>
      ) : null}
    </div>
  );
}
