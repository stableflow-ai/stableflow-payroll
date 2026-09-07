import { useEffect, useMemo, useRef, useState } from "react";
import { DateRangePicker } from "@/components/date-range-picker/DateRangePicker";
import { DATE_RANGE_PRESET } from "@/components/date-range-picker/config";
import { lastNDaysRange, rangeToUnixSeconds } from "@/components/date-range-picker/utils";
import { IconExportLink } from "@/components/icons/link";
import { IconLoading } from "@/components/icons/loading";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_VARIANT } from "@/components/ui/button/config";
import { SearchInput } from "@/components/ui/search-input/SearchInput";
import { useExpenseHistoryInfiniteQuery } from "@/hooks/use-expense-api";
import type { ExpenseHistoryRow } from "@/types/expense";
import { stampDownloadFilename } from "@/views/pay/utils";
import { EXPENSE_SEARCH_DEBOUNCE_MS, HISTORY_EXPORT_FILENAME } from "../../config";
import { HistoryTable } from "./HistoryTable";

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs, value]);
  return debounced;
}

function exportHistoryCsv(rows: ExpenseHistoryRow[]) {
  const header = "name,purpose,description,expense,address,token,network,amount,status";
  const body = rows.map((row) =>
    [
      row.name,
      row.purpose,
      row.receiptName ?? row.description ?? "",
      row.expense,
      row.address,
      row.token,
      row.network,
      row.amount,
      row.status,
    ].join(","),
  );
  const blob = new Blob([[header, ...body].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = stampDownloadFilename(HISTORY_EXPORT_FILENAME);
  link.click();
  URL.revokeObjectURL(url);
}

export function HistoryPanel() {
  const [search, setSearch] = useState("");
  const [range, setRange] = useState(() => lastNDaysRange(DATE_RANGE_PRESET.Days30));
  const debouncedSearch = useDebouncedValue(search, EXPENSE_SEARCH_DEBOUNCE_MS);
  const unixRange = rangeToUnixSeconds(range);
  const historyQuery = useExpenseHistoryInfiniteQuery({
    search: debouncedSearch,
    startTime: unixRange.start_time,
    endTime: unixRange.end_time,
  });
  const items = useMemo(
    () => historyQuery.data?.pages.flatMap((page) => page.list) ?? [],
    [historyQuery.data],
  );
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = Boolean(historyQuery.hasNextPage);
  const loadingMore = historyQuery.isFetchingNextPage;
  const fetchNextPage = historyQuery.fetchNextPage;

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
          className="h-9 w-full rounded-[10px] border-black/10 px-4 text-sm text-black sm:ml-auto sm:w-auto sm:min-w-[126px]"
          onClick={() => exportHistoryCsv(items)}
        >
          <IconExportLink className="size-3.5 shrink-0" />
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
