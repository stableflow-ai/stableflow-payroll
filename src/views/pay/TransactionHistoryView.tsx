import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { IconExportLink } from "@/components/icons/link";
import { DateRangePicker } from "@/components/date-range-picker/DateRangePicker";
import { DATE_RANGE_PRESET } from "@/components/date-range-picker/config";
import { lastNDaysRange, rangeToUnixSeconds } from "@/components/date-range-picker/utils";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_SIZE, BUTTON_VARIANT } from "@/components/ui/button/config";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { Pagination } from "@/components/ui/pagination/Pagination";
import { SearchInput } from "@/components/ui/search-input/SearchInput";
import { txExplorerUrl } from "@/config/chains";
import { useExportPaymentsMutation, usePaymentsQuery } from "@/hooks/use-payout-api";
import useToast from "@/hooks/use-toast";
import type { PayLayoutOutletContext } from "@/layouts/PayLayout";
import type { PayPaymentsExportQuery } from "@/types/payout";
import {
  HISTORY_ASSET_FILTER,
  HISTORY_PAGE_SIZE,
  HISTORY_STATUS_FILTER,
} from "./config";
import { PAYOUT_SYMBOLS } from "@/stores/intents-tokens";
import { PayoutsTable } from "./components/payout-table/PayoutsTable";
import { paymentRowStatus } from "./components/payout-table/PayoutStatusCell";
import {
  paymentDisplayAmount,
  paymentDisplayNetwork,
  paymentDisplayToken,
  paymentRowId,
} from "./utils";

function ExportCsvButton({ params }: { params: PayPaymentsExportQuery }) {
  const toast = useToast();
  const exportMutation = useExportPaymentsMutation();
  return (
    <Button
      variant={BUTTON_VARIANT.Normal}
      size={BUTTON_SIZE.Sm}
      loading={exportMutation.isPending}
      className="h-9 w-full shrink-0 whitespace-nowrap rounded-[6px] border-[#e3e3e3] px-3 text-black sm:w-auto sm:min-w-[141px]"
      onClick={() => {
        void exportMutation.mutateAsync(params).catch((error) => {
          toast.fail({
            title: error instanceof Error ? error.message : "Failed to export transactions",
          });
        });
      }}
    >
      Export CSV
      {exportMutation.isPending ? null : <IconExportLink className="size-3.5 shrink-0" />}
    </Button>
  );
}

export function TransactionHistoryView() {
  const { setHeaderExtra } = useOutletContext<PayLayoutOutletContext>();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>(HISTORY_STATUS_FILTER.All);
  const [asset, setAsset] = useState<string>(HISTORY_ASSET_FILTER.All);
  const [range, setRange] = useState(() => lastNDaysRange(DATE_RANGE_PRESET.Days30));
  const [page, setPage] = useState(1);
  const times = rangeToUnixSeconds(range);
  const exportParams = useMemo<PayPaymentsExportQuery>(
    () => ({
      q: search.trim() || undefined,
      status: status === HISTORY_STATUS_FILTER.All ? undefined : status,
      token: asset === HISTORY_ASSET_FILTER.All ? undefined : asset,
      start_time: times.start_time,
      end_time: times.end_time,
    }),
    [search, status, asset, times.start_time, times.end_time],
  );

  useEffect(() => {
    setHeaderExtra(<ExportCsvButton params={exportParams} />);
    return () => setHeaderExtra(null);
  }, [setHeaderExtra, exportParams]);

  const query = usePaymentsQuery({
    page,
    pageSize: HISTORY_PAGE_SIZE,
    q: search.trim() || undefined,
    status: status === HISTORY_STATUS_FILTER.All ? undefined : status,
    token: asset === HISTORY_ASSET_FILTER.All ? undefined : asset,
    start_time: times.start_time,
    end_time: times.end_time,
  });

  const totalPage = Math.max(1, query.data?.totalPage ?? 1);
  const safePage = Math.min(page, totalPage);
  const tableRows = (query.data?.list ?? []).map((row, index) => ({
    id: paymentRowId(row, index),
    recipient: row.recipient,
    amount: paymentDisplayAmount(row),
    token: paymentDisplayToken(row),
    network: paymentDisplayNetwork(row),
    memo: row.memo,
    time: row.submittedAt,
    status: paymentRowStatus(row.status),
    explorerUrl: txExplorerUrl(paymentDisplayNetwork(row), row.destinationTxHash),
  }));

  const defaultRange = lastNDaysRange(DATE_RANGE_PRESET.Days30);
  const filtersDirty =
    search.trim() !== ""
    || status !== HISTORY_STATUS_FILTER.All
    || asset !== HISTORY_ASSET_FILTER.All
    || range.from.getTime() !== defaultRange.from.getTime()
    || range.to.getTime() !== defaultRange.to.getTime();

  function resetFilters() {
    setSearch("");
    setStatus(HISTORY_STATUS_FILTER.All);
    setAsset(HISTORY_ASSET_FILTER.All);
    setRange(lastNDaysRange(DATE_RANGE_PRESET.Days30));
    setPage(1);
  }

  return (
    <div className="mx-auto w-full max-w-[1212px]">
      <div className="mb-4 flex flex-wrap items-center gap-3 justify-between">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search by address"
          className="w-full sm:max-w-[230px]"
        />
        <div className="flex flex-wrap items-center gap-3">
          <Dropdown
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            className="flex-1 md:w-[141px]"
            triggerClassName="w-full"
            options={[
              { value: HISTORY_STATUS_FILTER.All, label: "All Status" },
              { value: HISTORY_STATUS_FILTER.Complete, label: "Complete" },
              { value: HISTORY_STATUS_FILTER.Failed, label: "Failed" },
            ]}
          />
          <Dropdown
            value={asset}
            onChange={(value) => {
              setAsset(value);
              setPage(1);
            }}
            className="flex-1 md:w-[141px]"
            triggerClassName="w-full"
            options={[
              { value: HISTORY_ASSET_FILTER.All, label: "All Assets" },
              ...PAYOUT_SYMBOLS.map((symbol) => ({ value: symbol, label: symbol })),
            ]}
          />
          <DateRangePicker
            value={range}
            onChange={(next) => {
              setRange(next);
              setPage(1);
            }}
            className="flex-1 md:w-[200px]"
          />
          <button
            type="button"
            onClick={resetFilters}
            disabled={!filtersDirty}
            className="flex-1 font-montserrat text-sm font-medium text-[#aaa] hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear Filter
          </button>
        </div>
      </div>
      {query.isError ? (
        <p className="py-8 font-montserrat text-sm text-danger">
          {query.error instanceof Error ? query.error.message : "Failed to load transactions"}
        </p>
      ) : (
        <PayoutsTable
          rows={tableRows}
          empty={query.isPending ? "Loading transactions…" : "No transactions"}
        />
      )}
      <div className="mt-4 flex justify-center sm:justify-end">
        <Pagination page={safePage} totalPage={totalPage} onPageChange={setPage} />
      </div>
    </div>
  );
}
