import { useEffect, useRef } from "react";
import { IconAlertCircle } from "@/components/icons/alert";
import { IconLoading } from "@/components/icons/loading";
import {
  IconPayoutPaid,
  IconPayoutPending
} from "@/components/icons/payout-status";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_VARIANT } from "@/components/ui/button/config";
import { cn } from "@/lib/utils";
import type { PayrollHistoryRun } from "@/types/payroll";
import { DATE_FORMAT, formatAmount, formatDate } from "@/utils";
import { PAYROLL_RUN_STATUS, type PayrollRunStatus } from "../../config";

function statusTone(status: PayrollRunStatus) {
  if (status === PAYROLL_RUN_STATUS.Failed) {
    return {
      card: "bg-white bg-[radial-gradient(80%_160%_at_0%_0%,rgba(228,50,34,0.1),transparent_55%)]",
      badge: "bg-[#E43222]",
      icon: <IconAlertCircle className="size-4 text-white" />
    };
  }
  if (status === PAYROLL_RUN_STATUS.Paid) {
    return {
      card: "bg-white bg-[radial-gradient(80%_160%_at_0%_0%,rgba(129,198,0,0.1),transparent_55%)]",
      badge: "bg-[#81C600]",
      icon: <IconPayoutPaid className="size-4 text-white" />
    };
  }
  return {
    card: "bg-white bg-[radial-gradient(80%_160%_at_0%_0%,rgba(0,102,255,0.1),transparent_55%)]",
    badge: "bg-[#6284F5]",
    icon: <IconPayoutPending className="size-4 text-white" />
  };
}

function HistoryCard(props: {
  run: PayrollHistoryRun;
  onViewDetails: (run: PayrollHistoryRun) => void;
}) {
  const { run, onViewDetails } = props;
  const tone = statusTone(run.status);

  return (
    <article
      className={cn(
        "min-h-[146px] rounded-[20px] border border-[#f0f0f0] px-[30px] py-5 shadow-[0_0_20px_0_rgba(0,0,0,0.06)]",
        tone.card
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-montserrat text-[20px] font-semibold text-black">
          {run.title}
        </h3>
        <span
          className={cn(
            "inline-flex h-7 shrink-0 items-center gap-1 rounded-full pr-2.5 pl-1.5 font-montserrat text-sm font-medium text-white",
            tone.badge
          )}
        >
          <span className="size-4 shrink-0 overflow-clip">{tone.icon}</span>
          {run.paidCount} / {run.recipientCount}
        </span>
      </div>
      <div className="mt-[30px] flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4">
          <div>
            <p className="font-montserrat text-sm font-medium text-[#aaa]">
              Total Payout
            </p>
            <p className="mt-2.5 font-montserrat text-sm font-medium text-black">
              {formatAmount(run.totalPayout, { showDust: true })}
            </p>
          </div>
          <div>
            <p className="font-montserrat text-sm font-medium text-[#aaa]">
              Recipients
            </p>
            <p className="mt-2.5 font-montserrat text-sm font-medium text-black">
              {run.recipientCount}
            </p>
          </div>
          <div>
            <p className="font-montserrat text-sm font-medium text-[#aaa]">
              Transactions
            </p>
            <p className="mt-2.5 flex items-center gap-1.5 font-montserrat text-sm font-medium text-black">
              {run.transactionCount}
              {run.status === PAYROLL_RUN_STATUS.Pending ? (
                <IconPayoutPending className="size-4 shrink-0 text-[#6284F5]" />
              ) : null}
              {run.failedCount > 0 ? (
                <>
                  <IconAlertCircle className="size-4 shrink-0 text-[#E43222]" />
                  <span className="text-[#E43222]">
                    {run.failedCount} Failed
                  </span>
                </>
              ) : null}
            </p>
          </div>
          <div>
            <p className="font-montserrat text-sm font-medium capitalize text-[#aaa]">
              Execution Time
            </p>
            <p className="mt-2.5 font-montserrat text-sm font-medium text-black">
              {formatDate(run.executedAt, DATE_FORMAT.DateTime) || run.executedAt}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <Button
            variant={BUTTON_VARIANT.Normal}
            className="h-9 rounded-[10px] border-[rgba(0,0,0,0.10)] bg-[#FFF] px-4 text-[14px] text-[#000] md:h-9 md:text-[14px]"
            onClick={() => onViewDetails(run)}
          >
            View Details
          </Button>
          {/* <Button
            variant={BUTTON_VARIANT.Normal}
            aria-label="Open details"
            className="h-9 w-[39px] rounded-[10px] border-black/10 p-0 text-black"
          >
            <IconOutLink className="size-2.5" />
          </Button> */}
        </div>
      </div>
    </article>
  );
}

export function HistoryPanel(props: {
  items: PayrollHistoryRun[];
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onViewDetails: (run: PayrollHistoryRun) => void;
}) {
  const {
    items,
    loadingMore = false,
    hasMore = false,
    onLoadMore,
    onViewDetails,
  } = props;
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || loadingMore || !onLoadMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { rootMargin: "160px", threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, onLoadMore, items.length]);

  if (items.length === 0) {
    return (
      <div className="flex min-h-[280px] items-center justify-center">
        <p className="font-montserrat text-sm text-[#aaa]">
          No payroll history
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {items.map((run) => (
        <HistoryCard key={run.id} run={run} onViewDetails={onViewDetails} />
      ))}
      {hasMore ? <div ref={sentinelRef} className="h-4 shrink-0" aria-hidden /> : null}
      {loadingMore ? (
        <div className="flex items-center justify-center py-2">
          <IconLoading className="size-4 animate-spin text-[#909090]" />
        </div>
      ) : null}
    </div>
  );
}
