import { safeQueueUrl } from "@/config/chains";
import { useSafePendingPayoutStore } from "@/stores/safe-pending-payout";
import { safeAwaitingSignaturesMessage, SAFE_AWAITING_SIGNATURES_TITLE } from "@/wallet/evm/safe";

function remainingLabel(deadline: string, now: number): string | null {
  const deadlineMs = Date.parse(deadline);
  if (!Number.isFinite(deadlineMs)) return null;
  const remainingMs = deadlineMs - now;
  if (remainingMs <= 0) return "Quote expired";
  const hours = Math.floor(remainingMs / 3_600_000);
  if (hours >= 1) return `Quote valid for ~${hours}h`;
  return `Quote valid for ~${Math.max(1, Math.round(remainingMs / 60_000))}m`;
}

/**
 * The proposals started from this form.
 *
 * Signing and executing both happen inside Safe{Wallet}, so this only reports state
 * and links out — offering a confirm button here would imply we can advance the
 * transaction, which we cannot.
 */
export function SafePendingCard({ formKey }: { formKey: string }) {
  const items = useSafePendingPayoutStore((state) => state.items);
  const mine = formKey ? items.filter((item) => item.formKey === formKey) : [];
  if (mine.length === 0) return null;

  const now = Date.now();

  return (
    <div className="mt-6 rounded-[16px] border border-[#003bff]/20 bg-[#003bff]/5 p-4">
      <p className="font-montserrat text-sm font-medium text-black">
        {SAFE_AWAITING_SIGNATURES_TITLE}
      </p>
      <ul className="mt-3 space-y-3">
        {mine.map((item) => {
          const queueUrl = safeQueueUrl(item.chainId, item.safeAddress);
          const remaining = remainingLabel(item.deadline, now);
          return (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-montserrat text-sm text-black">{item.title}</p>
                <p className="mt-0.5 font-montserrat text-xs text-[#606060]">
                  {safeAwaitingSignaturesMessage(item.threshold)}
                  {remaining ? ` ${remaining}.` : ""}
                </p>
              </div>
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
            </li>
          );
        })}
      </ul>
    </div>
  );
}
