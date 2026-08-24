import { IconCheck2 } from "@/components/icons/check";
import { IconOutLink } from "@/components/icons/link";
import { IconLoading } from "@/components/icons/loading";
import { cn } from "@/lib/utils";

export const PAYOUT_ROW_STATUS = {
  Pending: "pending",
  Complete: "complete",
  Failed: "failed",
} as const;

export type PayoutRowStatus = (typeof PAYOUT_ROW_STATUS)[keyof typeof PAYOUT_ROW_STATUS];

export function paymentRowStatus(status: string): PayoutRowStatus {
  const key = status.toLowerCase();
  if (key === "completed" || key === "complete") return PAYOUT_ROW_STATUS.Complete;
  if (key === "failed") return PAYOUT_ROW_STATUS.Failed;
  return PAYOUT_ROW_STATUS.Pending;
}

function ExplorerLink({ href, className }: { href: string | null; className?: string }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn("shrink-0 text-black", className)}
      aria-label="View transaction"
    >
      <IconOutLink />
    </a>
  );
}

export function PayoutStatusCell(props: {
  status: PayoutRowStatus;
  explorerUrl?: string | null;
}) {
  const { status, explorerUrl = null } = props;

  if (status === PAYOUT_ROW_STATUS.Pending) {
    return (
      <span className="inline-flex w-full items-center gap-1.5">
        <IconLoading className="size-3 shrink-0 animate-spin text-[#6284F5]" />
        <span className="text-[#6284F5]">Pending</span>
        <span className="ml-auto">
          <ExplorerLink href={explorerUrl} />
        </span>
      </span>
    );
  }

  if (status === PAYOUT_ROW_STATUS.Failed) {
    return (
      <span className="inline-flex w-full items-center gap-1.5">
        <span className="text-danger">Failed</span>
        <span className="ml-auto">
          <ExplorerLink href={explorerUrl} />
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex w-full items-center gap-1.5 text-[#769400]">
      <IconCheck2 className="shrink-0 text-[#769400]" />
      <span>Complete</span>
      <span className="ml-auto">
        <ExplorerLink href={explorerUrl} />
      </span>
    </span>
  );
}
