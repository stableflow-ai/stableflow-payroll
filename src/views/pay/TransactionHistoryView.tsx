import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { IconExportLink } from "@/components/icons/link";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_SIZE, BUTTON_VARIANT } from "@/components/ui/button/config";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { Pagination } from "@/components/ui/pagination/Pagination";
import { SearchInput } from "@/components/ui/search-input/SearchInput";
import { useTransactionHistory } from "@/hooks/use-transaction-history";
import useToast from "@/hooks/use-toast";
import type { PayLayoutOutletContext } from "@/layouts/PayLayout";
import { HISTORY_PAGE_SIZE, HISTORY_STATUS_FILTER, HISTORY_TIME_FILTER } from "./config";
import { PayoutsTable } from "./components/payout-table/PayoutsTable";
import { PAYOUT_ROW_STATUS } from "./components/payout-table/PayoutStatusCell";
import { HISTORY_STATUS, type HistoryPayout } from "@/mocks/history";

function assetKey(row: HistoryPayout) {
  return `${row.symbol} · ${row.network}`;
}

function inTimeRange(iso: string, filter: string) {
  if (filter === HISTORY_TIME_FILTER.All) return true;
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return true;
  const days = filter === HISTORY_TIME_FILTER.Days30 ? 30 : 90;
  return Date.now() - time <= days * 24 * 60 * 60 * 1000;
}

function ExportCsvButton() {
  const toast = useToast();
  return (
    <Button
      variant={BUTTON_VARIANT.Normal}
      size={BUTTON_SIZE.Sm}
      className="h-9 w-full rounded-[6px] border-[#e3e3e3] px-3 text-black sm:w-[141px]"
      onClick={() => {
        // TODO(api): export CSV when the history export endpoint exists.
        toast.info({ title: "Export CSV is coming soon" });
      }}
    >
      Export CSV
      <IconExportLink className="size-3.5 shrink-0" />
    </Button>
  );
}

export function TransactionHistoryView() {
  const { setHeaderExtra } = useOutletContext<PayLayoutOutletContext>();
  const rows = useTransactionHistory();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>(HISTORY_STATUS_FILTER.All);
  const [asset, setAsset] = useState("all");
  const [time, setTime] = useState<string>(HISTORY_TIME_FILTER.All);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setHeaderExtra(<ExportCsvButton />);
    return () => setHeaderExtra(null);
  }, [setHeaderExtra]);

  const assetOptions = useMemo(() => {
    const unique = [...new Set(rows.map(assetKey))];
    return [
      { value: "all", label: "All Assets" },
      ...unique.map((value) => ({ value, label: value })),
    ];
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (q && !row.recipient.toLowerCase().includes(q)) return false;
      if (status === HISTORY_STATUS_FILTER.Complete && row.status !== HISTORY_STATUS.Complete) return false;
      if (status === HISTORY_STATUS_FILTER.Failed && row.status !== HISTORY_STATUS.Failed) return false;
      if (asset !== "all" && assetKey(row) !== asset) return false;
      if (!inTimeRange(row.time, time)) return false;
      return true;
    });
  }, [rows, search, status, asset, time]);

  const totalPage = Math.max(1, Math.ceil(filtered.length / HISTORY_PAGE_SIZE));
  const safePage = Math.min(page, totalPage);
  const pageRows = filtered.slice((safePage - 1) * HISTORY_PAGE_SIZE, safePage * HISTORY_PAGE_SIZE);

  const tableRows = pageRows.map((row) => ({
    id: row.id,
    recipient: row.recipient,
    amount: row.amount,
    token: row.symbol,
    network: row.network,
    memo: row.memo,
    time: row.time,
    status: row.status === HISTORY_STATUS.Failed ? PAYOUT_ROW_STATUS.Failed : PAYOUT_ROW_STATUS.Complete,
    explorerUrl: row.txUrl,
  }));

  const filtersDirty =
    search.trim() !== ""
    || status !== HISTORY_STATUS_FILTER.All
    || asset !== "all"
    || time !== HISTORY_TIME_FILTER.All;

  function resetFilters() {
    setSearch("");
    setStatus(HISTORY_STATUS_FILTER.All);
    setAsset("all");
    setTime(HISTORY_TIME_FILTER.All);
    setPage(1);
  }

  return (
    <div>
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
            options={assetOptions}
          />
          <Dropdown
            value={time}
            onChange={(value) => {
              setTime(value);
              setPage(1);
            }}
            className="flex-1 md:w-[141px]"
            triggerClassName="w-full"
            options={[
              { value: HISTORY_TIME_FILTER.All, label: "All Time" },
              { value: HISTORY_TIME_FILTER.Days30, label: "Last 30 days" },
              { value: HISTORY_TIME_FILTER.Days90, label: "Last 90 days" },
            ]}
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
      <PayoutsTable rows={tableRows} empty="No transactions" />
      <div className="mt-4 flex justify-center sm:justify-end">
        <Pagination page={safePage} totalPage={totalPage} onPageChange={setPage} />
      </div>
    </div>
  );
}
