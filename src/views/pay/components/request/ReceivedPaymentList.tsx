import { useMemo, useState } from "react";
import { Switch } from "@/components/ui/switch/Switch";
import type { ReceivedPayment } from "@/mocks/request-payment";
import { RECEIVED_STATUS } from "@/mocks/request-payment";
import { REQUEST_PAYMENT_COPY } from "../../config";
import { ReceivedPaymentRow } from "./ReceivedPaymentRow";

export function ReceivedPaymentList(props: {
  rows: ReceivedPayment[];
  pendingWithdrawCount: number;
  onWithdraw: (row: ReceivedPayment) => void;
}) {
  const { rows, pendingWithdrawCount, onWithdraw } = props;
  const [onlyPending, setOnlyPending] = useState(true);

  const visible = useMemo(() => {
    if (!onlyPending) return rows;
    return rows.filter((row) => row.status === RECEIVED_STATUS.Withdraw);
  }, [onlyPending, rows]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-montserrat text-base font-medium text-black">
          {REQUEST_PAYMENT_COPY.RECEIVED_PAYMENT}
        </h2>
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-montserrat text-sm text-[#606060]">
            {REQUEST_PAYMENT_COPY.TO_BE_WITHDRAW}
            {pendingWithdrawCount > 0 ? (
              <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#6284F5] px-1 font-montserrat text-[10px] font-medium text-white">
                {pendingWithdrawCount}
              </span>
            ) : null}
          </span>
          <Switch
            checked={onlyPending}
            onCheckedChange={setOnlyPending}
            aria-label={REQUEST_PAYMENT_COPY.TO_BE_WITHDRAW}
          />
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[minmax(200px,1.6fr)_minmax(140px,0.9fr)_minmax(140px,0.9fr)_minmax(110px,0.7fr)] gap-3 px-3 pb-2">
            <span className="font-montserrat text-xs text-[#909090]">{REQUEST_PAYMENT_COPY.COL_REQUEST}</span>
            <span className="font-montserrat text-xs text-[#909090]">{REQUEST_PAYMENT_COPY.COL_TIME}</span>
            <span className="font-montserrat text-xs text-[#909090]">{REQUEST_PAYMENT_COPY.COL_ADDRESS}</span>
            <span className="text-right font-montserrat text-xs text-[#909090]">{REQUEST_PAYMENT_COPY.COL_STATUS}</span>
          </div>
          {visible.length === 0 ? (
            <p className="px-3 py-6 font-montserrat text-sm text-[#909090]">{REQUEST_PAYMENT_COPY.EMPTY_LIST}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {visible.map((row) => (
                <ReceivedPaymentRow key={row.id} row={row} onWithdraw={() => onWithdraw(row)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
