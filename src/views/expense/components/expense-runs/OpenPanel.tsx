import type { ExpenseDraftRow, ExpenseOpenList } from "@/types/expense";
import type { Payable } from "@/types/payable";
import { formatAmount } from "@/utils";
import { CreateExpenseEmpty } from "./CreateExpenseEmpty";
import { OpenTable } from "./OpenTable";

function formatSplitUsd(value: string) {
  const formatted = formatAmount(value, { padDecimals: true });
  const dot = formatted.lastIndexOf(".");
  if (dot < 0) return { whole: formatted, fraction: "" };
  return {
    whole: formatted.slice(0, dot),
    fraction: formatted.slice(dot),
  };
}

export function OpenPanel(props: {
  list: ExpenseOpenList;
  onPayNow: (form: Payable) => void;
  onAddExpense: () => void;
  onImported: (rows: ExpenseDraftRow[]) => void;
  busy?: boolean;
}) {
  const { list, onPayNow, onAddExpense, onImported, busy = false } = props;
  const total = formatSplitUsd(list.total);

  if (list.batches.length === 0) {
    return (
      <CreateExpenseEmpty
        onAddExpense={onAddExpense}
        onImported={onImported}
        busy={busy}
      />
    );
  }

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:max-w-[760px]">
        <div>
          <p className="font-montserrat text-sm font-medium text-[#606060]">
            Open expense
          </p>
          <p className="mt-1.5 font-montserrat text-[20px] font-semibold capitalize text-black">
            <span>{total.whole}</span>
            {total.fraction ? (
              <span className="text-[#aaa]">{total.fraction}</span>
            ) : null}
          </p>
        </div>
        <div>
          <p className="font-montserrat text-sm font-medium capitalize text-[#606060]">
            Number of expenses
          </p>
          <p className="mt-1.5 font-montserrat text-[20px] font-semibold capitalize text-black">
            {list.count}
          </p>
        </div>
      </div>
      <div className="mt-5 border-t border-black/10 pt-5">
        <OpenTable batches={list.batches} onPayNow={onPayNow} />
      </div>
    </div>
  );
}
