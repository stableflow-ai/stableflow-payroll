import { formatAmount } from "@/utils";
import type { ReimbursementOpenList } from "@/mocks/reimbursement";
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

export function OpenPanel({ list }: { list: ReimbursementOpenList }) {
  const total = formatSplitUsd(list.total);

  if (list.rows.length === 0) {
    return (
      <div className="flex min-h-[280px] items-center justify-center">
        <p className="font-montserrat text-sm text-[#aaa]">No open reimbursements</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:max-w-[760px]">
        <div>
          <p className="font-montserrat text-sm font-medium text-[#606060]">
            Open reimbursement
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
            Number of reimbursements
          </p>
          <p className="mt-1.5 font-montserrat text-[20px] font-semibold capitalize text-black">
            {list.count}
          </p>
        </div>
      </div>
      <div className="mt-5 border-t border-black/10 pt-5">
        <OpenTable rows={list.rows} />
      </div>
    </div>
  );
}
