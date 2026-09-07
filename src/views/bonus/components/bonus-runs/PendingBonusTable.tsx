import { useState } from "react";
import { IconArrowDown } from "@/components/icons/arrow-down";
import { IconProcessing } from "@/components/icons/processing";
import { IconUp } from "@/components/icons/up";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_VARIANT } from "@/components/ui/button/config";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/Table";
import { cn } from "@/lib/utils";
import type { BonusPendingItem } from "@/types/bonus";
import type { PayableKey } from "@/types/payable";
import { formatAmount } from "@/utils";
import { PayoutRecipientCell } from "@/views/pay/components/payout-table/PayoutRecipientCell";
import {
  BONUS_ROW_ACTION,
  PENDING_BONUS_TABLE_COLUMNS,
  bonusPayNowPayable,
} from "../../config";
import { formatBonusTokenAmount } from "../../utils";

function ActionCell(props: {
  item: BonusPendingItem;
  onPayNow: (payable: PayableKey) => void;
}) {
  const { item, onPayNow } = props;

  if (item.action === BONUS_ROW_ACTION.Paying) {
    return (
      <Button
        variant={BUTTON_VARIANT.Normal}
        disabled
        className="h-9 min-w-[97px] rounded-[10px] border-black/10 px-3 text-sm text-[#606060]"
      >
        <IconProcessing className="size-2.5 shrink-0 animate-spin text-[#909090]" />
        Paying
      </Button>
    );
  }

  const payable = item.batchId > 0 ? bonusPayNowPayable(item.batchId) : null;

  return (
    <Button
      className="h-9 min-w-[113px] rounded-[10px] px-3 text-sm"
      disabled={!payable}
      onClick={() => {
        if (!payable) return;
        onPayNow(payable);
      }}
    >
      <IconUp className="size-3.5 shrink-0" />
      Pay Now
    </Button>
  );
}

function BonusItemBlock(props: {
  item: BonusPendingItem;
  onPayNow: (payable: PayableKey) => void;
}) {
  const { item, onPayNow } = props;
  const isGroup = item.members.length > 1;
  const [expanded, setExpanded] = useState(false);
  const sole = item.members[0];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[12px] bg-[#f6f6f6]",
        isGroup && expanded && "border border-[#d9d9d9]",
      )}
    >
      <TableRow className="min-h-14 border-0 bg-transparent py-3">
        <TableCell className="font-medium text-black first:pl-4">{item.title}</TableCell>
        <TableCell>
          {isGroup ? (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="inline-flex items-center gap-1.5 font-montserrat text-sm font-medium text-[#06f]"
              aria-expanded={expanded}
            >
              {item.members.length}
              <IconArrowDown
                className={cn(
                  "h-1 w-2.5 shrink-0 transition-transform",
                  expanded && "rotate-180",
                )}
              />
            </button>
          ) : (
            <span className="font-medium text-black">{sole?.name}</span>
          )}
        </TableCell>
        <TableCell className="font-medium text-black">
          {formatAmount(item.amount)}
        </TableCell>
        <TableCell>
          {!isGroup && sole?.address ? (
            <PayoutRecipientCell address={sole.address} prefix={5} suffix={5} />
          ) : null}
        </TableCell>
        <TableCell className="last:pr-4">
          <ActionCell item={item} onPayNow={onPayNow} />
        </TableCell>
      </TableRow>
      {isGroup && expanded ? (
        <div className="border-t border-black/10">
          {item.members.map((member, index) => (
            <TableRow
              key={member.id}
              className={cn(
                "min-h-12 border-0 bg-transparent py-2.5",
                index < item.members.length - 1 && "border-b border-black/10",
              )}
            >
              <TableCell className="first:pl-4" />
              <TableCell className="font-medium text-black">{member.name}</TableCell>
              <TableCell className="font-medium text-black">
                {formatBonusTokenAmount(member.amount, member.token)}
              </TableCell>
              <TableCell>
                <PayoutRecipientCell address={member.address} prefix={5} suffix={5} />
              </TableCell>
              <TableCell className="last:pr-4" />
            </TableRow>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PendingBonusTable(props: {
  items: BonusPendingItem[];
  onPayNow: (payable: PayableKey) => void;
}) {
  const { items, onPayNow } = props;
  return (
    <Table
      columns={PENDING_BONUS_TABLE_COLUMNS}
      className="border-0 bg-transparent p-0 shadow-none"
    >
      <TableHeader className="border-b-0 bg-transparent">
        <TableHead className="first:pl-4">Bonus Title</TableHead>
        <TableHead>Member</TableHead>
        <TableHead>Bonus</TableHead>
        <TableHead>Address</TableHead>
        <TableHead className="last:pr-4">Action</TableHead>
      </TableHeader>
      <TableBody className="mt-1 flex flex-col gap-4">
        {items.map((item) => (
          <BonusItemBlock key={item.id} item={item} onPayNow={onPayNow} />
        ))}
      </TableBody>
    </Table>
  );
}
