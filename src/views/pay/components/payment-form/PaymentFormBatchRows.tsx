import { Button } from "@/components/ui/button/Button";
import { formatAmount } from "@/utils";
import type { PayablePayQuoteBatch } from "@/types/payout";
import { AMOUNT_MAX_DECIMALS } from "../../config";
import { batchPaymentRowLabel, batchSplitBannerText } from "./config";

export function PaymentFormBatchRows(props: {
  batches: readonly PayablePayQuoteBatch[];
  sendingQuoteBatchId: string | null;
  paidQuoteBatchIds: ReadonlySet<string>;
  payDisabled: boolean;
  onPay: (quoteBatchId: string) => void;
}) {
  const { batches, sendingQuoteBatchId, paidQuoteBatchIds, payDisabled, onPay } = props;

  return (
    <>
      <div className="mt-6 rounded-[12px] border border-[#06f] bg-[rgba(0,102,255,0.1)] px-[13px] py-[7px]">
        <p className="font-montserrat text-sm font-normal leading-[1.5] text-[#06f]">
          {batchSplitBannerText(batches.length)}
        </p>
      </div>
      <div className="mt-6 flex flex-col gap-[22px]">
        {batches.map((row, index) => {
          const paid = paidQuoteBatchIds.has(row.quoteBatchId);
          const paying = sendingQuoteBatchId === row.quoteBatchId;
          const amount = formatAmount(row.batch.totalSourceAmount, {
            prefix: "",
            maxDecimals: AMOUNT_MAX_DECIMALS,
          });
          const symbol = row.batch.sourceSymbol.trim();
          const label = paid ? "Processing..." : paying ? "Paying..." : "Pay Now";
          return (
            <div key={row.quoteBatchId} className="flex items-center gap-3">
              <p className="font-montserrat text-sm font-medium text-[#606060]">
                {batchPaymentRowLabel(index + 1)}
              </p>
              <p className="ml-auto font-montserrat text-sm font-semibold text-[#606060]">
                {symbol ? `${amount} ${symbol}` : amount}
              </p>
              <Button
                size="lg"
                className="h-[50px] w-[164px] shrink-0"
                disabled={payDisabled || paid || paying}
                onClick={() => onPay(row.quoteBatchId)}
              >
                {label}
              </Button>
            </div>
          );
        })}
      </div>
    </>
  );
}
