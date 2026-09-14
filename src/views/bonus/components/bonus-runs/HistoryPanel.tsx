import { useEffect, useRef } from "react";
import { IconLoading } from "@/components/icons/loading";
import type { BonusHistoryItem } from "@/types/bonus";
import { HistoryTable } from "@/views/expense/components/expense-runs/HistoryTable";
import { BONUS_HISTORY_PATH } from "../../config";

export function HistoryPanel(props: {
  items: BonusHistoryItem[];
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}) {
  const { items, loadingMore = false, hasMore = false, onLoadMore } = props;
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
        <p className="font-montserrat text-sm text-[#aaa]">No bonus history</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <HistoryTable
        rows={items}
        successPath={BONUS_HISTORY_PATH}
        amountLabel="Bonus"
        descriptionLabel="Description"
      />
      {hasMore ? <div ref={sentinelRef} className="h-4 shrink-0" aria-hidden /> : null}
      {loadingMore ? (
        <div className="flex items-center justify-center py-2">
          <IconLoading className="size-4 animate-spin text-[#909090]" />
        </div>
      ) : null}
    </div>
  );
}
