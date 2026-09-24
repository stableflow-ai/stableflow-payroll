import { useEffect, useMemo, useRef, useState } from "react";
import { DateRangePicker } from "@stableflow/pay-ui/date-range-picker";
import { DATE_RANGE_PRESET } from "@stableflow/pay-ui/date-range-picker";
import { lastNDaysRange, rangeToUnixSeconds } from "@stableflow/pay-ui/date-range-picker";
import { IconExportLink } from "@stableflow/pay-ui/icons/link";
import { IconLoading } from "@stableflow/pay-ui/icons/loading";
import { Button } from "@stableflow/pay-ui/button";
import { BUTTON_VARIANT } from "@stableflow/pay-ui/button";
import {
  useOperationHistoryExportMutation,
  useOperationHistoryInfiniteQuery,
} from "@/hooks/use-operation-api";
import useToast from "@/hooks/use-toast";
import { HistoryTable } from "@/views/expense/components/expense-runs/HistoryTable";
import { categoryHistoryPath } from "../../config";

function queryErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function OperationHistoryPanel(props: { category: string }) {
  const { category } = props;
  const toast = useToast();
  const [range, setRange] = useState(() => lastNDaysRange(DATE_RANGE_PRESET.Days30));
  const unixRange = rangeToUnixSeconds(range);
  const historyQuery = useOperationHistoryInfiniteQuery(category, {
    startTime: unixRange.start_time,
    endTime: unixRange.end_time,
  });
  const exportMutation = useOperationHistoryExportMutation(category);
  const items = useMemo(
    () => historyQuery.data?.pages.flatMap((page) => page.list) ?? [],
    [historyQuery.data],
  );
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = Boolean(historyQuery.hasNextPage);
  const loadingMore = historyQuery.isFetchingNextPage;
  const fetchNextPage = historyQuery.fetchNextPage;
  const exporting = exportMutation.isPending;

  useEffect(() => {
    if (!hasMore || loadingMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void fetchNextPage();
      },
      { rootMargin: "160px", threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasMore, loadingMore, items.length]);

  async function handleExport() {
    try {
      await exportMutation.mutateAsync({
        startTime: unixRange.start_time,
        endTime: unixRange.end_time,
      });
    } catch (error) {
      toast.fail({
        title: queryErrorMessage(error, "Could not export payout history"),
      });
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <DateRangePicker value={range} onChange={setRange} className="w-full sm:w-[179px]" />
        <Button
          variant={BUTTON_VARIANT.Normal}
          loading={exporting}
          className="h-9 w-full rounded-[10px] border-black/10 px-4 text-sm text-black sm:ml-auto sm:w-auto sm:min-w-[126px]"
          onClick={() => {
            void handleExport();
          }}
        >
          {exporting ? null : <IconExportLink className="size-3.5 shrink-0" />}
          Export CSV
        </Button>
      </div>
      {historyQuery.isLoading ? (
        <div className="mt-5">
          <HistoryTable rows={[]} successPath={categoryHistoryPath(category)} loading />
        </div>
      ) : historyQuery.isError ? (
        <p className="mt-5 font-montserrat text-sm text-danger">
          {queryErrorMessage(historyQuery.error, "Failed to load payout history")}
        </p>
      ) : items.length === 0 ? (
        <div className="flex min-h-[280px] items-center justify-center">
          <p className="font-montserrat text-sm text-[#aaa]">No payout history</p>
        </div>
      ) : (
        <div className="mt-5">
          <HistoryTable rows={items} successPath={categoryHistoryPath(category)} />
          {hasMore ? <div ref={sentinelRef} className="h-4 shrink-0" aria-hidden /> : null}
          {loadingMore ? (
            <div className="flex items-center justify-center py-3">
              <IconLoading className="size-4 animate-spin text-[#909090]" />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
