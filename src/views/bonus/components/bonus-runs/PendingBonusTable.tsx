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
import type { BonusPendingItem } from "@/mocks/bonus";
import { PayoutRecipientCell } from "@/views/pay/components/payout-table/PayoutRecipientCell";
import {
  BONUS_PAY_NOW_FORM_ID,
  BONUS_ROW_ACTION,
  PENDING_BONUS_TABLE_COLUMNS,
} from "../../config";
import { formatBonusTokenAmount } from "../../utils";

function ActionCell(props: {
  item: BonusPendingItem;
  onPayNow: (formId: string) => void;
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

  const formId =
    BONUS_PAY_NOW_FORM_ID[item.id as keyof typeof BONUS_PAY_NOW_FORM_ID];

  return (
    <Button
      className="h-9 min-w-[113px] rounded-[10px] px-3 text-sm"
      onClick={() => {
        if (!formId) return;
        onPayNow(formId);
      }}
    >
      <IconUp className="size-3.5 shrink-0" />
      Pay Now
    </Button>
  );
}

function BonusItemBlock(props: {
  item: BonusPendingItem;
  onPayNow: (formId: string) => void;
}) {
  const { item, onPayNow } = props;
  const isGroup = item.members.length > 1;
  const [expanded, setExpanded] = useState(() =>
    isGroup && /team b/i.test(item.title),
  );
  const sole = item.members[0];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[12px] bg-[#f6f6f6]",
        isGroup && expanded && "border border-[#d9d9d9]",
      )}
    >
      <TableRow className="min-h-14 border-0 bg-transparent px-4 py-3">
        <TableCell className="font-medium text-black">{item.title}</TableCell>
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
          {formatBonusTokenAmount(item.amount, item.token)}
        </TableCell>
        <TableCell>
          {!isGroup && sole?.address ? (
            <PayoutRecipientCell address={sole.address} prefix={5} suffix={5} />
          ) : null}
        </TableCell>
        <TableCell>
          <ActionCell item={item} onPayNow={onPayNow} />
        </TableCell>
      </TableRow>
      {isGroup && expanded ? (
        <div className="border-t border-black/10">
          {item.members.map((member, index) => (
            <TableRow
              key={member.id}
              className={cn(
                "min-h-12 border-0 bg-transparent px-4 py-2.5",
                index < item.members.length - 1 && "border-b border-black/10",
              )}
            >
              <TableCell />
              <TableCell className="font-medium text-black">{member.name}</TableCell>
              <TableCell className="font-medium text-black">
                {formatBonusTokenAmount(member.amount, member.token)}
              </TableCell>
              <TableCell>
                <PayoutRecipientCell address={member.address} prefix={5} suffix={5} />
              </TableCell>
              <TableCell />
            </TableRow>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PendingBonusTable(props: {
  items: BonusPendingItem[];
  onPayNow: (formId: string) => void;
}) {
  const { items, onPayNow } = props;
  return (
    <Table
      columns={PENDING_BONUS_TABLE_COLUMNS}
      className="border-0 bg-transparent p-0 shadow-none"
    >
      <TableHeader className="border-b-0 bg-transparent">
        <TableHead>Bonus Title</TableHead>
        <TableHead>Member</TableHead>
        <TableHead>Bonus</TableHead>
        <TableHead>Address</TableHead>
        <TableHead>Action</TableHead>
      </TableHeader>
      <TableBody className="mt-1 flex flex-col gap-4">
        {items.map((item) => (
          <BonusItemBlock key={item.id} item={item} onPayNow={onPayNow} />
        ))}
      </TableBody>
    </Table>
  );
}
