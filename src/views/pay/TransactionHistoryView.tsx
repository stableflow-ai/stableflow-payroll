import { useEffect, useMemo, useState } from "react";
import { IconExportLink } from "@/components/icons/link";
import { DateRangePicker } from "@/components/date-range-picker/DateRangePicker";
import { DATE_RANGE_PRESET } from "@/components/date-range-picker/config";
import { lastNDaysRange, rangeToUnixSeconds } from "@/components/date-range-picker/utils";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_SIZE, BUTTON_VARIANT } from "@/components/ui/button/config";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { Pagination } from "@/components/ui/pagination/Pagination";
import { SearchInput } from "@/components/ui/search-input/SearchInput";
import { FIXED_CHAINS } from "@/config/chains";
import { useExportHistoryMutation, useHistoryQuery } from "@/hooks/use-history-api";
import useToast from "@/hooks/use-toast";
import { organizationId } from "@/lib/auth-role";
import { PAYOUT_SYMBOLS } from "@/stores/intents-tokens";
import { useAuthStore } from "@/stores/auth";
import type { HistoryExportQuery, HistoryQuery, HistoryStatus } from "@/types/history";
import { HISTORY_STATUS } from "@/types/history";
import { HistoryTable } from "./components/history/HistoryTable";
import {
  HISTORY_FILTER_ALL,
  HISTORY_PAGE_SIZE,
  HISTORY_SEARCH_DEBOUNCE_MS,
  HISTORY_STATUS_FILTER,
  HISTORY_STATUS_OPTIONS,
} from "./components/history/config";
import { historyOptionalFilter } from "./components/history/utils";

const NETWORK_OPTIONS = [
  { value: HISTORY_FILTER_ALL, label: "All" },
  ...FIXED_CHAINS.map((chain) => ({ value: chain.blockchain, label: chain.chainName })),
];

const TOKEN_OPTIONS = [
  { value: HISTORY_FILTER_ALL, label: "All" },
  ...PAYOUT_SYMBOLS.map((symbol) => ({ value: symbol, label: symbol })),
];

const HISTORY_STATUSES = new Set<string>(Object.values(HISTORY_STATUS));

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs, value]);
  return debounced;
}

function historyStatusFilter(value: string): HistoryStatus | undefined {
  const next = historyOptionalFilter(value);
  if (!next || !HISTORY_STATUSES.has(next)) return undefined;
  return next as HistoryStatus;
}

export function TransactionHistoryView() {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const orgId = organizationId(user);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>(HISTORY_STATUS_FILTER.All);
  const [sourceNetwork, setSourceNetwork] = useState<string>(HISTORY_FILTER_ALL);
  const [sourceToken, setSourceToken] = useState<string>(HISTORY_FILTER_ALL);
  const [destNetwork, setDestNetwork] = useState<string>(HISTORY_FILTER_ALL);
  const [destToken, setDestToken] = useState<string>(HISTORY_FILTER_ALL);
  const [range, setRange] = useState(() => lastNDaysRange(DATE_RANGE_PRESET.Days30));
  const [page, setPage] = useState(1);
  const times = rangeToUnixSeconds(range);
  const debouncedSearch = useDebouncedValue(search, HISTORY_SEARCH_DEBOUNCE_MS);
  const exportMutation = useExportHistoryMutation();

  const filters = useMemo((): HistoryExportQuery | null => {
    if (orgId == null) return null;
    return {
      organizationId: orgId,
      q: debouncedSearch.trim() || undefined,
      status: historyStatusFilter(status),
      sourceNetwork: historyOptionalFilter(sourceNetwork),
      sourceToken: historyOptionalFilter(sourceToken),
      destNetwork: historyOptionalFilter(destNetwork),
      destToken: historyOptionalFilter(destToken),
      startTime: times.start_time,
      endTime: times.end_time,
    };
  }, [
    debouncedSearch,
    destNetwork,
    destToken,
    orgId,
    sourceNetwork,
    sourceToken,
    status,
    times.end_time,
    times.start_time,
  ]);

  const listParams = useMemo((): HistoryQuery | null => {
    if (!filters) return null;
    return {
      ...filters,
      page,
      pageSize: HISTORY_PAGE_SIZE,
    };
  }, [filters, page]);

  const query = useHistoryQuery(listParams);

  const totalPage = Math.max(1, query.data?.totalPage ?? 1);
  const safePage = Math.min(page, totalPage);
  const rows = query.data?.list ?? [];

  const resetPage = () => setPage(1);

  function handleExport() {
    if (!filters) return;
    void exportMutation.mutateAsync(filters).catch((error) => {
      toast.fail({
        title: error instanceof Error ? error.message : "Failed to export transactions",
      });
    });
  }

  return (
    <div className="mx-auto w-full max-w-[1212px]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            resetPage();
          }}
          placeholder="Search"
          className="w-full sm:max-w-[230px]"
        />
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker
            value={range}
            onChange={(next) => {
              setRange(next);
              resetPage();
            }}
            className="w-full min-w-0 sm:w-auto sm:min-w-[179px]"
            triggerClassName="rounded-[10px] border-black/10"
          />
          <Button
            variant={BUTTON_VARIANT.Normal}
            size={BUTTON_SIZE.Sm}
            className="h-9 w-full shrink-0 whitespace-nowrap rounded-[10px] border-black/10 px-3 text-black sm:w-auto"
            loading={exportMutation.isPending}
            disabled={!filters}
            onClick={handleExport}
          >
            Export CSV
            {exportMutation.isPending ? null : <IconExportLink className="size-3.5 shrink-0" />}
          </Button>
        </div>
      </div>
      {query.isError ? (
        <p className="py-8 font-montserrat text-sm text-danger">
          {query.error instanceof Error ? query.error.message : "Failed to load transactions"}
        </p>
      ) : (
        <HistoryTable
          rows={rows}
          empty={query.isLoading ? "Loading transactions…" : "No transactions"}
          toolbar={
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Dropdown
                label="Source Network"
                value={sourceNetwork}
                onChange={(value) => {
                  setSourceNetwork(value);
                  resetPage();
                }}
                options={NETWORK_OPTIONS}
                className="min-w-0 w-full"
                triggerClassName="w-full"
              />
              <Dropdown
                label="Source Token"
                value={sourceToken}
                onChange={(value) => {
                  setSourceToken(value);
                  resetPage();
                }}
                options={TOKEN_OPTIONS}
                className="min-w-0 w-full"
                triggerClassName="w-full"
              />
              <Dropdown
                label="Destination Network"
                value={destNetwork}
                onChange={(value) => {
                  setDestNetwork(value);
                  resetPage();
                }}
                options={NETWORK_OPTIONS}
                className="min-w-0 w-full"
                triggerClassName="w-full"
              />
              <Dropdown
                label="Destination Token"
                value={destToken}
                onChange={(value) => {
                  setDestToken(value);
                  resetPage();
                }}
                options={TOKEN_OPTIONS}
                className="min-w-0 w-full"
                triggerClassName="w-full"
              />
              <Dropdown
                label="Status"
                value={status}
                onChange={(value) => {
                  setStatus(value);
                  resetPage();
                }}
                options={[...HISTORY_STATUS_OPTIONS]}
                className="min-w-0 w-full"
                triggerClassName="w-full"
              />
            </div>
          }
          footer={
            <div className="mt-4 flex justify-center sm:justify-end">
              <Pagination page={safePage} totalPage={totalPage} onPageChange={setPage} />
            </div>
          }
        />
      )}
    </div>
  );
}
