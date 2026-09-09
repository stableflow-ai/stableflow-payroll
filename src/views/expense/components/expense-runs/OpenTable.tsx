import { useState } from "react";
import { IconArrowDown } from "@/components/icons/arrow-down";
import { IconUp } from "@/components/icons/up";
import { Button } from "@/components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/Table";
import { chainDisplayName } from "@/config/chains";
import { cn } from "@/lib/utils";
import type { ExpenseOpenBatch } from "@/types/expense";
import type { Payable } from "@/types/payable";
import { formatAmount } from "@/utils";
import { PayoutRecipientCell } from "@/views/pay/components/payout-table/PayoutRecipientCell";
import { expenseBatchToPayable } from "@/views/pay/components/payment-form/from-source";
import {
  EXPENSE_ROW_ACTION,
  OPEN_EXPENSE_TABLE_COLUMNS,
} from "../../config";

function payoutPreference(token: string, network: string): string {
  if (!token && !network) return "-";
  if (!network) return token;
  if (!token) return chainDisplayName(network);
  return `${token} · ${chainDisplayName(network)}`;
}

function RowAction(props: {
  action: ExpenseOpenBatch["action"];
  batch: ExpenseOpenBatch;
  onPayNow: (form: Payable) => void;
}) {
  const { action, batch, onPayNow } = props;
  if (action === EXPENSE_ROW_ACTION.Paying) {
    return (
      <Button
        loading
        className="h-9 min-w-[97px] whitespace-nowrap rounded-[10px] px-4 text-sm"
      >
        Paying
      </Button>
    );
  }

  const form = expenseBatchToPayable(batch);

  return (
    <Button
      className="h-9 min-w-[113px] whitespace-nowrap rounded-[10px] px-4 text-sm"
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

function ExpenseBatchBlock(props: {
  batch: ExpenseOpenBatch;
  onPayNow: (form: Payable) => void;
}) {
  const { batch, onPayNow } = props;
  const isGroup = batch.members.length > 1;
  const [expanded, setExpanded] = useState(false);
  const sole = batch.members[0];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[12px] bg-[#f6f6f6]",
        isGroup && expanded && "border border-[#d9d9d9]",
      )}
    >
      <TableRow className="min-h-14 border-0 bg-transparent py-3">
        <TableCell className="font-medium text-black first:pl-4">
          <span className="truncate">{batch.title}</span>
        </TableCell>
        <TableCell>
          {isGroup ? (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="inline-flex items-center gap-1.5 font-montserrat text-sm font-medium text-[#06f]"
              aria-expanded={expanded}
            >
              {batch.members.length}
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
          {isGroup ? (
            <span className="font-medium text-black">-</span>
          ) : sole?.address ? (
            <PayoutRecipientCell address={sole.address} />
          ) : (
            "-"
          )}
        </TableCell>
        <TableCell className="font-medium text-black">
          {isGroup ? "-" : payoutPreference(sole?.token ?? "", sole?.network ?? "")}
        </TableCell>
        <TableCell className="font-medium text-black">
          {formatAmount(batch.volume, { prefix: "", showDust: true })}
        </TableCell>
        <TableCell className="justify-end last:pr-4">
          <RowAction
            action={batch.action}
            batch={batch}
            onPayNow={onPayNow}
          />
        </TableCell>
      </TableRow>
      {isGroup && expanded ? (
        <div className="border-t border-black/10">
          {batch.members.map((member, index) => (
            <TableRow
              key={member.id}
              className={cn(
                "min-h-12 border-0 bg-transparent py-2.5",
                index < batch.members.length - 1 && "border-b border-black/10",
              )}
            >
              <TableCell className="first:pl-4" />
              <TableCell className="font-medium text-black">{member.name}</TableCell>
              <TableCell>
                {member.address ? (
                  <PayoutRecipientCell address={member.address} />
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell className="font-medium text-black">
                {payoutPreference(member.token, member.network)}
              </TableCell>
              <TableCell className="font-medium text-black">
                {formatAmount(member.amount, { prefix: "", showDust: true })}
              </TableCell>
              <TableCell className="last:pr-4" />
            </TableRow>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function OpenTable(props: {
  batches: ExpenseOpenBatch[];
  onPayNow: (form: Payable) => void;
}) {
  const { batches, onPayNow } = props;
  return (
    <Table
      columns={OPEN_EXPENSE_TABLE_COLUMNS}
      className="border-0 bg-transparent p-0 shadow-none"
    >
      <TableHeader className="border-b-0 bg-transparent">
        <TableHead className="first:pl-4">Title</TableHead>
        <TableHead>Name</TableHead>
        <TableHead>Address</TableHead>
        <TableHead>Payout Preference</TableHead>
        <TableHead>Amount</TableHead>
        <TableHead className="last:pr-4" />
      </TableHeader>
      <TableBody className="mt-1 flex flex-col gap-4">
        {batches.map((batch) => (
          <ExpenseBatchBlock
            key={batch.batchId || batch.title}
            batch={batch}
            onPayNow={onPayNow}
          />
        ))}
      </TableBody>
    </Table>
  );
}
