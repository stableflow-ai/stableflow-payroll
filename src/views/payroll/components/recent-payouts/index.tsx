import { useEffect, useRef } from "react";
import { IconAlertCircle } from "@/components/icons/alert";
import { IconArrowDown } from "@/components/icons/arrow-down";
import { IconLoading } from "@/components/icons/loading";
import {
  IconPayoutFailed,
  IconPayoutPaid,
  IconPayoutPending,
} from "@/components/icons/payout-status";
import { Card } from "@/components/ui/card/Card";
import { chainDisplayName } from "@/config/chains";
import { cn } from "@/lib/utils";
import type { PayrollRecentPayout } from "@/types/payroll";
import { formatAddress, formatAmount } from "@/utils";
import {
  PAYROLL_PAYOUT_STATUS,
  PAYROLL_STATUS_FAILED_CLASS,
  PAYROLL_STATUS_PAID_CLASS,
  type PayrollPayoutStatus,
} from "../../config";

function statusLabel(status: PayrollPayoutStatus) {
  if (status === PAYROLL_PAYOUT_STATUS.Failed) return "Failed";
  if (status === PAYROLL_PAYOUT_STATUS.Paid) return "Paid";
  return "Pending";
}

function StatusMark({ status }: { status: PayrollPayoutStatus }) {
  if (status === PAYROLL_PAYOUT_STATUS.Failed) {
    return <IconPayoutFailed className={cn("size-[26px]", PAYROLL_STATUS_FAILED_CLASS)} />;
  }
  if (status === PAYROLL_PAYOUT_STATUS.Paid) {
    return <IconPayoutPaid className={cn("size-[26px]", PAYROLL_STATUS_PAID_CLASS)} />;
  }
  return <IconPayoutPending className="size-[26px] text-[#6284F5]" />;
}

function statusClass(status: PayrollPayoutStatus) {
  if (status === PAYROLL_PAYOUT_STATUS.Failed) return PAYROLL_STATUS_FAILED_CLASS;
  if (status === PAYROLL_PAYOUT_STATUS.Paid) return PAYROLL_STATUS_PAID_CLASS;
  return "text-[#06f]";
}

export function RecentPayoutsCard(props: {
  items: PayrollRecentPayout[];
  failedCount: number;
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  error?: string | null;
  onLoadMore?: () => void;
  onOpenHistory: () => void;
}) {
  const {
    items,
    failedCount,
    loading = false,
    loadingMore = false,
    hasMore = false,
    error = null,
    onLoadMore,
    onOpenHistory,
  } = props;
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!hasMore || loading || loadingMore || !onLoadMore) return;
    const root = listRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { root, rootMargin: "40px", threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, onLoadMore, items.length]);

  return (
    <Card className="flex min-h-[454px] flex-col">
      <div className="flex items-center gap-2">
        <h2 className="font-montserrat text-lg font-medium capitalize text-black">
          Recent Payouts
        </h2>
        {!loading && failedCount > 0 ? (
          <span className="inline-flex h-7 items-center gap-1 rounded-full bg-[#E43222] pr-3 pl-2 font-montserrat text-sm font-medium text-white">
            <span className="size-4 shrink-0 overflow-clip">
              <IconAlertCircle className="size-4" />
            </span>
            {failedCount} Failed
          </span>
        ) : null}
      </div>
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <IconLoading className="size-5 animate-spin text-[#909090]" />
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="font-montserrat text-sm text-danger">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="font-montserrat text-sm font-normal text-[#aaa]">No recent payouts</p>
        </div>
      ) : (
        <div ref={listRef} className="mt-4 min-h-0 flex-1 overflow-y-auto">
          <ul className="flex flex-col max-h-[350px]">
            {items.map((item) => (
              <li key={item.id} className="border-b border-black/10 last:border-b-0">
                <button
                  type="button"
                  onClick={onOpenHistory}
                  className="flex w-full items-center gap-3 py-3.5 text-left"
                >
                  <StatusMark status={item.status} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-montserrat text-sm font-medium text-black">
                      {formatAmount(item.amount, { prefix: "", showDust: true })} {item.token} ·{" "}
                      {chainDisplayName(item.network)}
                    </span>
                    <span className="mt-0.5 block font-montserrat text-[10px] text-[#606060]">
                      To {formatAddress(item.recipient, 5, 4)}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 font-montserrat text-xs font-medium",
                      statusClass(item.status),
                    )}
                  >
                    {statusLabel(item.status)}
                  </span>
                  <IconArrowDown className="-rotate-90 text-black" />
                </button>
              </li>
            ))}
            {hasMore ? <li ref={sentinelRef} className="h-4 shrink-0" aria-hidden /> : null}
            {loadingMore ? (
              <li className="flex items-center justify-center py-3">
                <IconLoading className="size-4 animate-spin text-[#909090]" />
              </li>
            ) : null}
          </ul>
        </div>
      )}
    </Card>
  );
}
