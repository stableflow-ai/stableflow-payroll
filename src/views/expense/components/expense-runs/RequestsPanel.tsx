import { IconLoading } from "@/components/icons/loading";
import { useExpenseOpenRequestsQuery } from "@/hooks/use-expense-api";
import type { PayableKey } from "@/types/payable";
import { formatAmount } from "@/utils";
import { RequestsTable } from "./RequestsTable";

function formatSplitUsd(value: string) {
  const formatted = formatAmount(value, { padDecimals: true });
  const dot = formatted.lastIndexOf(".");
  if (dot < 0) return { whole: formatted, fraction: "" };
  return {
    whole: formatted.slice(0, dot),
    fraction: formatted.slice(dot),
  };
}

function queryErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function RequestsPanel(props: { onPayNow: (payable: PayableKey) => void }) {
  const { onPayNow } = props;
  const requestsQuery = useExpenseOpenRequestsQuery();
  const list = requestsQuery.data ?? { total: "0", count: 0, batches: [] };
  const total = formatSplitUsd(list.total);

  if (requestsQuery.isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <IconLoading className="size-5 animate-spin text-[#909090]" />
      </div>
    );
  }

  if (requestsQuery.isError) {
    return (
      <p className="font-montserrat text-sm text-danger">
        {queryErrorMessage(requestsQuery.error, "Failed to load payment requests")}
      </p>
    );
  }

  if (list.batches.length === 0) {
    return (
      <div className="flex min-h-[280px] items-center justify-center">
        <p className="font-montserrat text-sm text-[#aaa]">No payment requests</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:max-w-[760px]">
        <div>
          <p className="font-montserrat text-sm font-medium text-[#606060]">
            Request to pay
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
            Number of Requests
          </p>
          <p className="mt-1.5 font-montserrat text-[20px] font-semibold capitalize text-black">
            {list.count}
          </p>
        </div>
      </div>
      <div className="mt-5 border-t border-black/10 pt-5">
        <RequestsTable
          rows={list.batches.flatMap((batch) => batch.members)}
          onPayNow={onPayNow}
        />
      </div>
    </div>
  );
}
