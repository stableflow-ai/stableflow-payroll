import type { OperationDraftRow, OperationOpenList } from "@/types/operation";
import type { Payable } from "@/types/payable";
import { formatAmount } from "@/utils";
import { CreateOperationEmpty } from "./create-empty";
import { OperationOpenTable } from "./open-table";

function formatSplitUsd(value: string) {
  const formatted = formatAmount(value, { padDecimals: true });
  const dot = formatted.lastIndexOf(".");
  if (dot < 0) return { whole: formatted, fraction: "" };
  return {
    whole: formatted.slice(0, dot),
    fraction: formatted.slice(dot),
  };
}

export function OperationOpenPanel(props: {
  list: OperationOpenList;
  category: string;
  onPayNow: (form: Payable) => void;
  onAdd: () => void;
  onImported: (rows: OperationDraftRow[]) => void;
  busy?: boolean;
}) {
  const { list, category, onPayNow, onAdd, onImported, busy = false } = props;
  const total = formatSplitUsd(list.total);

  if (list.batches.length === 0) {
    return (
      <CreateOperationEmpty onAdd={onAdd} onImported={onImported} busy={busy} />
    );
  }

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:max-w-[760px]">
        <div>
          <p className="font-montserrat text-sm font-medium text-[#606060]">Open payments</p>
          <p className="mt-1.5 font-montserrat text-[20px] font-semibold capitalize text-black">
            <span>{total.whole}</span>
            {total.fraction ? (
              <span className="text-[#aaa]">{total.fraction}</span>
            ) : null}
          </p>
        </div>
        <div>
          <p className="font-montserrat text-sm font-medium capitalize text-[#606060]">
            Number of payments
          </p>
          <p className="mt-1.5 font-montserrat text-[20px] font-semibold capitalize text-black">
            {list.count}
          </p>
        </div>
      </div>
      <div className="mt-5 border-t border-black/10 pt-5">
        <OperationOpenTable
          batches={list.batches}
          category={category}
          onPayNow={onPayNow}
        />
      </div>
    </div>
  );
}
