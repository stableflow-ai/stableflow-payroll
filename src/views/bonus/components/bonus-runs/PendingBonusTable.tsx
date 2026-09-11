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
import type { Payable } from "@/types/payable";
import { formatAmount } from "@/utils";
import { DescriptionCell } from "@/views/expense/components/expense-runs/DescriptionCell";
import { ExternalLinkConfirmDialog } from "@/views/expense/components/expense-runs/ExternalLinkConfirmDialog";
import { PlainTextCell } from "@/views/expense/components/expense-runs/PlainTextCell";
import { PayoutRecipientCell } from "@/views/pay/components/payout-table/PayoutRecipientCell";
import { bonusItemToPayable } from "@/views/pay/components/payment-form/from-source";
import {
  BONUS_ROW_ACTION,
  PENDING_BONUS_TABLE_COLUMNS,
} from "../../config";
import { formatBonusTokenAmount } from "../../utils";

function ActionCell(props: {
  item: BonusPendingItem;
  onPayNow: (form: Payable) => void;
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

  const form = bonusItemToPayable(item);

  return (
    <Button
      className="h-9 min-w-[113px] rounded-[10px] px-3 text-sm whitespace-nowrap"
      disabled={!form}
      onClick={() => {
        if (!form) return;
        onPayNow(form);
      }}
    >
      <IconUp className="size-3.5 shrink-0" />
      Pay Now
    </Button>
  );
}

function BonusItemBlock(props: {
  item: BonusPendingItem;
  onPayNow: (form: Payable) => void;
  onOpenUrl: (url: string) => void;
}) {
  const { item, onPayNow, onOpenUrl } = props;
  const isGroup = item.members.length > 1;
  const [expanded, setExpanded] = useState(false);
  const sole = item.members[0];

  return (
    <div
      className={cn(
        "min-w-min w-full overflow-hidden rounded-[12px] bg-[#f6f6f6]",
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
        <TableCell>
          <PlainTextCell grouped={isGroup} value={sole?.purpose} />
        </TableCell>
        <TableCell>
          <DescriptionCell
            value={isGroup ? "" : sole?.description ?? ""}
            onOpenUrl={onOpenUrl}
          />
        </TableCell>
        <TableCell className="font-medium text-black">
          {formatAmount(item.amount, { showDust: true })}
        </TableCell>
        <TableCell>
          {!isGroup && sole?.address ? (
            <PayoutRecipientCell address={sole.address} prefix={5} suffix={5} />
          ) : (
            <span className="font-medium text-black">-</span>
          )}
        </TableCell>
        <TableCell>
          <PlainTextCell grouped={isGroup} value={sole?.email} />
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
              <TableCell>
                <PlainTextCell grouped={false} value={member.purpose} />
              </TableCell>
              <TableCell>
                <DescriptionCell value={member.description} onOpenUrl={onOpenUrl} />
              </TableCell>
              <TableCell className="font-medium text-black">
                {formatBonusTokenAmount(member.amount, member.token)}
              </TableCell>
              <TableCell>
                <PayoutRecipientCell address={member.address} prefix={5} suffix={5} />
              </TableCell>
              <TableCell>
                <PlainTextCell grouped={false} value={member.email} />
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
  onPayNow: (form: Payable) => void;
}) {
  const { items, onPayNow } = props;
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  function handleConfirmExternalLink() {
    if (!pendingUrl) return;
    window.open(pendingUrl, "_blank", "noopener,noreferrer");
    setPendingUrl(null);
  }

  return (
    <>
      <Table
        columns={PENDING_BONUS_TABLE_COLUMNS}
        className="border-0 bg-transparent p-0 shadow-none"
      >
        <TableHeader className="border-b-0 bg-transparent">
          <TableHead className="first:pl-4">Bonus Title</TableHead>
          <TableHead>Member</TableHead>
          <TableHead>Purpose</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Bonus</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>Email</TableHead>
          <TableHead className="last:pr-4">Action</TableHead>
        </TableHeader>
        <TableBody className="mt-1 flex min-w-min flex-col gap-4">
          {items.map((item) => (
            <BonusItemBlock
              key={item.id}
              item={item}
              onPayNow={onPayNow}
              onOpenUrl={setPendingUrl}
            />
          ))}
        </TableBody>
      </Table>
      <ExternalLinkConfirmDialog
        open={Boolean(pendingUrl)}
        url={pendingUrl}
        onClose={() => setPendingUrl(null)}
        onConfirm={handleConfirmExternalLink}
      />
    </>
  );
}
