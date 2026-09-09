import type { BonusPendingList } from "@/types/bonus";
import type { PayableKey } from "@/types/payable";
import { formatAmount } from "@/utils";
import { PendingBonusTable } from "./PendingBonusTable";

export function PendingBonusPanel(props: {
  list: BonusPendingList;
  onPayNow: (payable: PayableKey) => void;
}) {
  const { list, onPayNow } = props;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-8 sm:gap-16">
        <div>
          <p className="font-montserrat text-sm font-medium capitalize text-[#606060]">
            Bonuses to be paid
          </p>
          <p className="mt-1.5 font-montserrat text-[20px] font-semibold capitalize text-black">
            {formatAmount(list.totalAmount)}
          </p>
        </div>
        <div>
          <p className="font-montserrat text-sm font-medium capitalize text-[#606060]">
            Members
          </p>
          <p className="mt-1.5 font-montserrat text-[20px] font-semibold capitalize text-black">
            {list.entryCount}
          </p>
        </div>
      </div>
      <div className="border-t border-black/10 pt-4">
        <PendingBonusTable items={list.items} onPayNow={onPayNow} />
      </div>
    </div>
  );
}
