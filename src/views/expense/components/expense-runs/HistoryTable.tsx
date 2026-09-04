import { IconAlert } from "@/components/icons/alert";
import { IconCheck2 } from "@/components/icons/check";
import { IconOutLink } from "@/components/icons/link";
import { IconReceipt } from "@/components/icons/receipt";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/Table";
import { chainDisplayName, txExplorerUrl } from "@/config/chains";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/utils";
import { PayoutRecipientCell } from "@/views/pay/components/payout-table/PayoutRecipientCell";
import type { ExpenseHistoryRow } from "@/mocks/expense";
import {
  HISTORY_EXPENSE_TABLE_COLUMNS,
  EXPENSE_HISTORY_FAILED_CLASS,
  EXPENSE_HISTORY_PAID_CLASS,
  EXPENSE_PAYOUT_STATUS,
} from "../../config";

function DescriptionCell({ row }: { row: ExpenseHistoryRow }) {
  if (row.receiptName) {
    return (
      <span
        className="flex min-w-0 max-w-full items-center gap-2 font-normal text-[#6284F5]"
        title={row.receiptName}
      >
        <IconReceipt className="size-3.5 shrink-0" />
        <span className="truncate">{row.receiptName}</span>
      </span>
    );
  }

  return <span className="truncate font-normal text-black">{row.description}</span>;
}

function StatusCell({ row }: { row: ExpenseHistoryRow }) {
  if (row.status === EXPENSE_PAYOUT_STATUS.Failed) {
    return (
      <span
        className={cn(
          "inline-flex h-[26px] items-center gap-1 rounded-[15px] border border-[rgba(255,83,83,0.5)] bg-white px-2",
          EXPENSE_HISTORY_FAILED_CLASS,
        )}
      >
        <IconAlert className="h-[7px] w-0.5 shrink-0" />
        Failed
      </span>
    );
  }

  const explorerUrl = txExplorerUrl(row.network, row.txHash);

  return (
    <span className={cn("inline-flex items-center gap-1.5", EXPENSE_HISTORY_PAID_CLASS)}>
      <IconCheck2 className="size-3.5 shrink-0" />
      Paid
      {explorerUrl ? (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-black"
          aria-label="View transaction"
        >
          <IconOutLink className="size-2.5" />
        </a>
      ) : (
        <IconOutLink className="size-2.5 text-black" />
      )}
    </span>
  );
}

export function HistoryTable({ rows }: { rows: ExpenseHistoryRow[] }) {
  return (
    <Table
      columns={HISTORY_EXPENSE_TABLE_COLUMNS}
      className="border-0 bg-transparent p-0 shadow-none"
    >
      <TableHeader className="border-b-0 bg-transparent">
        <TableHead>Name</TableHead>
        <TableHead>Purpose</TableHead>
        <TableHead className="normal-case">Description / Receipt</TableHead>
        <TableHead>Expense</TableHead>
        <TableHead>Address</TableHead>
        <TableHead>Payout Preference</TableHead>
        <TableHead>Amount</TableHead>
        <TableHead>Status</TableHead>
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
              <DescriptionCell row={row} />
            </TableCell>
            <TableCell>{formatAmount(row.expense)}</TableCell>
            <TableCell>
              <PayoutRecipientCell address={row.address} />
            </TableCell>
            <TableCell>
              {row.token} · {chainDisplayName(row.network)}
            </TableCell>
            <TableCell>{formatAmount(row.amount, { prefix: "" })}</TableCell>
            <TableCell>
              <StatusCell row={row} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
