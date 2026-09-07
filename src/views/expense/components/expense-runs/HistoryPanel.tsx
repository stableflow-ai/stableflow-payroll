import { useEffect, useMemo, useRef, useState } from "react";
import { DateRangePicker } from "@/components/date-range-picker/DateRangePicker";
import { DATE_RANGE_PRESET } from "@/components/date-range-picker/config";
import { lastNDaysRange, rangeToUnixSeconds } from "@/components/date-range-picker/utils";
import { IconExportLink } from "@/components/icons/link";
import { IconLoading } from "@/components/icons/loading";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_VARIANT } from "@/components/ui/button/config";
import { SearchInput } from "@/components/ui/search-input/SearchInput";
import {
  useExpenseHistoryExportMutation,
  useExpenseHistoryInfiniteQuery,
} from "@/hooks/use-expense-api";
import useToast from "@/hooks/use-toast";
import { EXPENSE_SEARCH_DEBOUNCE_MS } from "../../config";
import { HistoryTable } from "./HistoryTable";

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs, value]);
  return debounced;
}

function queryErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function HistoryPanel() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [range, setRange] = useState(() => lastNDaysRange(DATE_RANGE_PRESET.Days30));
  const debouncedSearch = useDebouncedValue(search, EXPENSE_SEARCH_DEBOUNCE_MS);
  const unixRange = rangeToUnixSeconds(range);
  const historyQuery = useExpenseHistoryInfiniteQuery({
    search: debouncedSearch,
    startTime: unixRange.start_time,
    endTime: unixRange.end_time,
  });
  const exportMutation = useExpenseHistoryExportMutation();
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
        search: debouncedSearch.trim() || undefined,
        startTime: unixRange.start_time,
        endTime: unixRange.end_time,
      });
    } catch (error) {
      toast.fail({
        title: queryErrorMessage(error, "Could not export expense history"),
      });
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="search name / address / amount"
          className="w-full sm:max-w-[313px]"
          inputClassName="rounded-[6px] border-[#e3e3e3] placeholder:text-black/30"
        />
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
        <div className="flex min-h-[280px] items-center justify-center">
          <IconLoading className="size-5 animate-spin text-[#909090]" />
        </div>
      ) : historyQuery.isError ? (
        <p className="mt-5 font-montserrat text-sm text-danger">
          {historyQuery.error instanceof Error
            ? historyQuery.error.message
            : "Failed to load expense history"}
        </p>
      ) : items.length === 0 ? (
        <div className="flex min-h-[280px] items-center justify-center">
          <p className="font-montserrat text-sm text-[#aaa]">No expense history</p>
        </div>
      ) : (
        <div className="mt-5">
          <HistoryTable rows={items} />
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
