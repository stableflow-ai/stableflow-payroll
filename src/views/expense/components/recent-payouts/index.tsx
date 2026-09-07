import { useEffect, useRef } from "react";
import { IconAlertCircle } from "@/components/icons/alert";
import { IconArrowDown } from "@/components/icons/arrow-down";
import { IconCheck } from "@/components/icons/check";
import { IconLoading } from "@/components/icons/loading";
import { IconProcessing } from "@/components/icons/processing";
import { Card } from "@/components/ui/card/Card";
import { chainDisplayName } from "@/config/chains";
import { cn } from "@/lib/utils";
import type { ExpenseRecentPayout } from "@/types/expense";
import { formatAddress, formatAmount } from "@/utils";
import {
  EXPENSE_PAYOUT_STATUS,
  EXPENSE_STATUS_FAILED_CLASS,
  EXPENSE_STATUS_PAID_CLASS,
  EXPENSE_STATUS_PENDING_CLASS,
  type ExpensePayoutStatus,
} from "../../config";

function statusLabel(status: ExpensePayoutStatus) {
  if (status === EXPENSE_PAYOUT_STATUS.Failed) return "Failed";
  if (status === EXPENSE_PAYOUT_STATUS.Paid) return "Paid";
  return "Pending";
}

function StatusMark({ status }: { status: ExpensePayoutStatus }) {
  if (status === EXPENSE_PAYOUT_STATUS.Failed) {
    return (
      <span
        className={cn(
          "flex size-[26px] shrink-0 items-center justify-center rounded-full bg-[#E43222]/15 font-montserrat text-xs font-medium",
          EXPENSE_STATUS_FAILED_CLASS,
        )}
      >
        !
      </span>
    );
  }
  if (status === EXPENSE_PAYOUT_STATUS.Paid) {
    return (
      <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-[#84A20F]/15">
        <IconCheck className={cn("size-3", EXPENSE_STATUS_PAID_CLASS)} />
      </span>
    );
  }
  return (
    <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-[#3F8AFB]/20">
      <IconProcessing className="size-2.5 animate-spin text-[#6284F5]" />
    </span>
  );
}

function statusClass(status: ExpensePayoutStatus) {
  if (status === EXPENSE_PAYOUT_STATUS.Failed) {
    return EXPENSE_STATUS_FAILED_CLASS;
  }
  if (status === EXPENSE_PAYOUT_STATUS.Paid) {
    return EXPENSE_STATUS_PAID_CLASS;
  }
  return EXPENSE_STATUS_PENDING_CLASS;
}

export function RecentPayoutsCard(props: {
  items: ExpenseRecentPayout[];
  failedCount?: number;
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  error?: string | null;
  onLoadMore?: () => void;
}) {
  const {
    items,
    failedCount = 0,
    loading = false,
    loadingMore = false,
    hasMore = false,
    error = null,
    onLoadMore,
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
          <p className="font-montserrat text-sm font-normal text-[#aaa]">
            No recent payouts
          </p>
        </div>
      ) : (
        <div ref={listRef} className="mt-4 min-h-0 flex-1 overflow-y-auto">
          <ul className="flex flex-col">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-2.5 border-b border-black/10 py-3.5 last:border-b-0"
              >
                <StatusMark status={item.status} />
                <span className="min-w-0 flex-1">
                  <span className="block font-montserrat text-sm font-medium text-black">
                    {formatAmount(item.amount, { prefix: "", showDust: true })} {item.token}{" "}
                    · {chainDisplayName(item.network)}
                  </span>
                  <span className="mt-0.5 block font-montserrat text-[10px] text-[#606060]">
                    To {formatAddress(item.recipient)}
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
