import { IconPlus } from "@/components/icons/plus";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_VARIANT } from "@/components/ui/button/config";
import type { BonusPendingList } from "@/mocks/bonus";
import { formatBonusTokenAmount } from "../../utils";
import { PendingBonusTable } from "./PendingBonusTable";

export function PendingBonusPanel(props: {
  list: BonusPendingList;
  onAddBonus: () => void;
  onPayNow: (formId: string) => void;
}) {
  const { list, onAddBonus, onPayNow } = props;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid grid-cols-2 gap-8 sm:gap-16">
          <div>
            <p className="font-montserrat text-sm font-medium capitalize text-[#606060]">
              Bonuses to be paid
            </p>
            <p className="mt-1.5 font-montserrat text-[20px] font-semibold capitalize text-black">
              {formatBonusTokenAmount(list.totalAmount, list.token)}
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
        <Button
          variant={BUTTON_VARIANT.Normal}
          className="h-9 min-w-[138px] rounded-[10px] border-black/10 px-4 text-sm text-black"
          onClick={onAddBonus}
        >
          <IconPlus className="size-3 shrink-0" />
          Add Bonus
        </Button>
      </div>
      <div className="border-t border-black/10 pt-4">
        <PendingBonusTable items={list.items} onPayNow={onPayNow} />
      </div>
    </div>
  );
}
