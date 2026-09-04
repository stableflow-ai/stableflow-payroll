import { useMemo, useState } from "react";
import { DateRangePicker } from "@/components/date-range-picker/DateRangePicker";
import { DATE_RANGE_PRESET } from "@/components/date-range-picker/config";
import { isInDateRange, lastNDaysRange } from "@/components/date-range-picker/utils";
import { IconExportLink } from "@/components/icons/link";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_VARIANT } from "@/components/ui/button/config";
import { SearchInput } from "@/components/ui/search-input/SearchInput";
import type { ExpenseHistoryRow } from "@/mocks/expense";
import { HISTORY_EXPORT_FILENAME } from "../../config";
import { HistoryTable } from "./HistoryTable";

function matchesSearch(row: ExpenseHistoryRow, query: string) {
  if (!query) return true;
  const haystack = [
    row.name,
    row.purpose,
    row.description,
    row.receiptName,
    row.address,
    row.amount,
    row.expense,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
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
  link.download = HISTORY_EXPORT_FILENAME;
  link.click();
  URL.revokeObjectURL(url);
}

export function HistoryPanel({ items }: { items: ExpenseHistoryRow[] }) {
  const [search, setSearch] = useState("");
  const [range, setRange] = useState(() => lastNDaysRange(DATE_RANGE_PRESET.Days30));

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter(
      (row) => matchesSearch(row, query) && isInDateRange(row.paidAt, range),
    );
  }, [items, search, range]);

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
          onClick={() => exportHistoryCsv(filtered)}
        >
          <IconExportLink className="size-3.5 shrink-0" />
          Export CSV
        </Button>
      </div>
      {filtered.length === 0 ? (
        <div className="flex min-h-[280px] items-center justify-center">
          <p className="font-montserrat text-sm text-[#aaa]">No expense history</p>
        </div>
      ) : (
        <div className="mt-5">
          <HistoryTable rows={filtered} />
        </div>
      )}
    </div>
  );
}
