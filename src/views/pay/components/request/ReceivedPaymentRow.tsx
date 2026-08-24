import { IconGuard } from "@/components/icons/guard";
import { tokenLogoUrl } from "@/lib/logo";
import { cn } from "@/lib/utils";
import { formatAddress, formatAmount, formatDate } from "@/utils";
import type { ReceivedPayment } from "@/mocks/request-payment";
import { RECEIVED_STATUS } from "@/mocks/request-payment";

export function ReceivedPaymentRow(props: {
  row: ReceivedPayment;
  onWithdraw: () => void;
}) {
  const { row, onWithdraw } = props;
  const amountLabel = `${formatAmount(row.amount, { prefix: "", maxDecimals: 6 })} ${row.symbol} · ${row.network}`;

  return (
    <div className="grid min-h-14 grid-cols-[minmax(200px,1.6fr)_minmax(140px,0.9fr)_minmax(140px,0.9fr)_minmax(110px,0.7fr)] items-center gap-3 rounded-[8px] bg-[#f6f6f6] px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <img src={tokenLogoUrl(row.symbol)} alt="" className="size-5 shrink-0 rounded-full object-cover" />
        <div className="min-w-0">
          <p className="truncate font-montserrat text-sm font-medium text-black">{amountLabel}</p>
          {row.private ? (
            <span className="mt-0.5 inline-flex items-center gap-1 font-montserrat text-[10px] text-[#606060]">
              <IconGuard className="h-3 w-2.5 text-[#6284F5]" />
              Private
            </span>
          ) : null}
        </div>
      </div>
      <p className="truncate font-montserrat text-sm text-[#606060]">{formatDate(row.receivedAt)}</p>
      <p className="truncate font-montserrat text-sm text-[#606060]">{formatAddress(row.address)}</p>
      <div className="flex justify-end">
        {row.status === RECEIVED_STATUS.Withdraw ? (
          <button
            type="button"
            onClick={onWithdraw}
            className="inline-flex h-7 items-center rounded-full border border-black/10 bg-white px-3 font-montserrat text-xs font-medium text-black"
          >
            Withdraw
          </button>
        ) : (
          <span
            className={cn(
              "font-montserrat text-sm",
              row.status === RECEIVED_STATUS.Withdrawed ? "text-[#909090]" : "text-[#16a34a]",
            )}
          >
            {row.status === RECEIVED_STATUS.Withdrawed ? "Withdrawed" : "Received"}
          </span>
        )}
      </div>
    </div>
  );
}

