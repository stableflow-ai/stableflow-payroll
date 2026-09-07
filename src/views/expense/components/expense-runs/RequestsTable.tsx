import { looksLikeExpenseReceipt } from "@/api/expense";
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
import type { ExpenseOpenRow } from "@/types/expense";
import type { PayableKey } from "@/types/payable";
import {
  REQUEST_PAYMENTS_TABLE_COLUMNS,
  EXPENSE_PAY_NOW_PAYABLE,
  EXPENSE_ROW_ACTION,
} from "../../config";

function DescriptionCell({ value }: { value: string }) {
  const text = value.trim();
  if (!text) {
    return <span className="text-black">-</span>;
  }
  if (looksLikeExpenseReceipt(text)) {
    return (
      <span
        className="flex min-w-0 max-w-full items-center gap-2 font-normal text-[#6284F5]"
        title={text}
      >
        <IconReceipt className="size-3.5 shrink-0" />
        <span className="truncate">{text}</span>
      </span>
    );
  }
  return <span className="truncate font-normal text-black">{text}</span>;
}

function RowAction(props: {
  action: ExpenseOpenRow["action"];
  onPayNow: () => void;
}) {
  const { action, onPayNow } = props;
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

  return (
    <Button
      className="h-9 min-w-[130px] whitespace-nowrap rounded-[10px] px-4 text-sm"
      onClick={onPayNow}
    >
      <IconUp className="size-3.5 shrink-0" />
      Pay Now
    </Button>
  );
}

export function RequestsTable(props: {
  rows: ExpenseOpenRow[];
  onPayNow: (payable: PayableKey) => void;
}) {
  const { rows, onPayNow } = props;
  return (
    <Table
      columns={REQUEST_PAYMENTS_TABLE_COLUMNS}
      className="border-0 bg-transparent p-0 shadow-none"
    >
      <TableHeader className="border-b-0 bg-transparent">
        <TableHead className="first:pl-4">Name</TableHead>
        <TableHead className="normal-case">Request for</TableHead>
        <TableHead>Description</TableHead>
        <TableHead>Address</TableHead>
        <TableHead>Payout Preference</TableHead>
        <TableHead>Amount</TableHead>
        <TableHead className="last:pr-4" />
      </TableHeader>
      <TableBody className="flex flex-col gap-4">
        {rows.map((row) => (
          <TableRow
            key={row.id}
            className="h-14 rounded-[12px] border-0 bg-[#f6f6f6] [&>*]:py-0"
          >
            <TableCell className="first:pl-4">{row.name || "-"}</TableCell>
            <TableCell>{row.purpose || "-"}</TableCell>
            <TableCell>
              <DescriptionCell value={row.receiptName} />
            </TableCell>
            <TableCell>
              {row.address ? (
                <PayoutRecipientCell address={row.address} />
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell>
              {row.token || row.network
                ? `${row.token} · ${chainDisplayName(row.network)}`
                : "-"}
            </TableCell>
            <TableCell>{formatAmount(row.amount, { prefix: "" })}</TableCell>
            <TableCell className="justify-end last:pr-4">
              <RowAction
                action={row.action}
                onPayNow={() => onPayNow(EXPENSE_PAY_NOW_PAYABLE)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
