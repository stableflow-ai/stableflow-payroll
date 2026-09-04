import { IconReceipt } from "@/components/icons/receipt";
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
import { formatAmount } from "@/utils";
import { PayoutRecipientCell } from "@/views/pay/components/payout-table/PayoutRecipientCell";
import type { ExpenseOpenRow } from "@/mocks/expense";
import {
  OPEN_EXPENSE_TABLE_COLUMNS,
  EXPENSE_ROW_ACTION,
} from "../../config";

function ReceiptCell({ name }: { name: string }) {
  return (
    <span
      className="flex min-w-0 max-w-full items-center gap-2 text-[#aaa] hover:text-[#6284F5]"
      title={name}
    >
      <IconReceipt className="size-3.5 shrink-0" />
      <span className="truncate">{name}</span>
    </span>
  );
}

function RowAction({ action }: { action: ExpenseOpenRow["action"] }) {
  if (action === EXPENSE_ROW_ACTION.Paying) {
    return (
      <Button
        loading
        className="h-9 min-w-[97px] rounded-[10px] px-4 text-sm"
      >
        Paying
      </Button>
    );
  }

  return (
    <Button className="h-9 min-w-[113px] rounded-[10px] px-4 text-sm">
      <IconUp className="size-3.5 shrink-0" />
      Pay Now
    </Button>
  );
}

export function OpenTable({ rows }: { rows: ExpenseOpenRow[] }) {
  return (
    <Table
      columns={OPEN_EXPENSE_TABLE_COLUMNS}
      className="border-0 bg-transparent p-0 shadow-none"
    >
      <TableHeader className="border-b-0 bg-transparent">
        <TableHead>Name</TableHead>
        <TableHead>Purpose</TableHead>
        <TableHead>Receipt</TableHead>
        <TableHead>Expense</TableHead>
        <TableHead>Address</TableHead>
        <TableHead>Payout Preference</TableHead>
        <TableHead>Amount</TableHead>
        <TableHead />
      </TableHeader>
      <TableBody className="flex flex-col gap-4">
        {rows.map((row) => (
          <TableRow
            key={row.id}
            className="h-14 rounded-[12px] border-0 bg-[#f6f6f6] px-4 [&>*]:py-0"
          >
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.purpose}</TableCell>
            <TableCell>
              <ReceiptCell name={row.receiptName} />
            </TableCell>
            <TableCell>{formatAmount(row.expense)}</TableCell>
            <TableCell>
              <PayoutRecipientCell address={row.address} />
            </TableCell>
            <TableCell>
              {row.token} · {chainDisplayName(row.network)}
            </TableCell>
            <TableCell>{formatAmount(row.amount, { prefix: "" })}</TableCell>
            <TableCell className="justify-end">
              <RowAction action={row.action} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
