import { useEffect, useRef } from "react";
import { IconLoading } from "@/components/icons/loading";
import type { BonusHistoryItem } from "@/types/bonus";
import { DATE_FORMAT, formatAddress, formatAmount, formatDate } from "@/utils";
import { IconCopy } from "@/components/icons";
import useToast from "@/hooks/use-toast";

export function HistoryPanel(props: {
  items: BonusHistoryItem[];
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}) {
  const { items, loadingMore = false, hasMore = false, onLoadMore } = props;
  const sentinelRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

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

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success({
      title: "Copied",
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {items.map((item) => (
        <article
          key={item.id}
          className="min-h-[100px] rounded-[20px] border border-[#f0f0f0] px-[30px] py-5 shadow-[0_0_20px_0_rgba(0,0,0,0.06)]"
        >
          <h3 className="font-montserrat text-[20px] font-semibold text-black">
            {item.title}
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="font-montserrat text-sm font-medium text-[#aaa]">
                Total Payout
              </p>
              <p className="mt-2 font-montserrat text-sm font-medium text-black">
                {formatAmount(item.totalPayout, { showDust: true })}
              </p>
            </div>
            <div>
              <p className="font-montserrat text-sm font-medium text-[#aaa]">
                Address
              </p>
              <p className="mt-2 font-montserrat text-sm font-medium text-black flex items-center gap-2">
                {formatAddress(item.recipient)}
                <button
                  type="button"
                  onClick={() => copyToClipboard(item.recipient)}
                >
                  <IconCopy className="size-3 text-[#909090]" />
                </button>
              </p>
            </div>
            <div>
              <p className="font-montserrat text-sm font-medium text-[#aaa]">
                Execution Time
              </p>
              <p className="mt-2 font-montserrat text-sm font-medium text-black">
                {formatDate(item.executedAt, DATE_FORMAT.DateTime) || item.executedAt}
              </p>
            </div>
          </div>
        </article>
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
