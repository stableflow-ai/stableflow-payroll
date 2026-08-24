import { Button } from "@/components/ui/button/Button";
import { BUTTON_SIZE, BUTTON_VARIANT } from "@/components/ui/button/config";
import { IconGuard } from "@/components/icons/guard";
import { tokenLogoUrl } from "@/lib/logo";
import { cn } from "@/lib/utils";
import { formatAddress, formatAmount, formatDate } from "@/utils";
import type { ReceivedPayment } from "@/mocks/request-payment";
import { RECEIVED_STATUS } from "@/mocks/request-payment";

export function ReceivedPaymentRow(props: {
  row: ReceivedPayment;
  withdrawing?: boolean;
  withdrawDisabled?: boolean;
  onWithdraw: () => void;
}) {
  const { row, withdrawing = false, withdrawDisabled = false, onWithdraw } = props;
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
          <Button
            type="button"
            variant={BUTTON_VARIANT.Normal}
            size={BUTTON_SIZE.Sm}
            loading={withdrawing}
            disabled={withdrawDisabled}
            onClick={onWithdraw}
            className="h-7 rounded-full px-3 text-xs"
          >
            Withdraw
          </Button>
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
