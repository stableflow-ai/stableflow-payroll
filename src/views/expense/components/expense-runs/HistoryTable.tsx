import { useState } from "react";
import { IconAlert } from "@/components/icons/alert";
import { IconCheck2 } from "@/components/icons/check";
import { IconOutLink } from "@/components/icons/link";
import { IconPayoutPending } from "@/components/icons/payout-status";
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
import type { ExpenseHistoryRow } from "@/types/expense";
import {
  HISTORY_EXPENSE_TABLE_COLUMNS,
  EXPENSE_HISTORY_FAILED_CLASS,
  EXPENSE_HISTORY_PAID_CLASS,
  EXPENSE_PAYOUT_STATUS,
  EXPENSE_STATUS_PENDING_CLASS,
} from "../../config";
import { DescriptionCell } from "./DescriptionCell";
import { ExternalLinkConfirmDialog } from "./ExternalLinkConfirmDialog";

function StatusCell({ row }: { row: ExpenseHistoryRow }) {
  if (row.status === EXPENSE_PAYOUT_STATUS.Failed) {
    return (
      <span
        className={cn(
          "inline-flex h-[26px] items-center gap-1 rounded-[15px] border border-[rgba(255,83,83,0.5)] bg-white px-2",
          EXPENSE_HISTORY_FAILED_CLASS,
        )}
      >
        <IconAlert className="h-2.5 w-1 shrink-0" />
        Failed
      </span>
    );
  }

  if (row.status !== EXPENSE_PAYOUT_STATUS.Paid) {
    return (
      <span className={cn("inline-flex items-center gap-1.5", EXPENSE_STATUS_PENDING_CLASS)}>
        <IconPayoutPending className="size-4 shrink-0" />
        Pending
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
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  function handleConfirmExternalLink() {
    if (!pendingUrl) return;
    window.open(pendingUrl, "_blank", "noopener,noreferrer");
    setPendingUrl(null);
  }

  return (
    <>
      <Table
        columns={HISTORY_EXPENSE_TABLE_COLUMNS}
        className="border-0 bg-transparent p-0 shadow-none"
      >
        <TableHeader className="border-b-0 bg-transparent">
          <TableHead className="first:pl-4">Name</TableHead>
          <TableHead>Purpose</TableHead>
          <TableHead className="normal-case">Description / Receipt</TableHead>
          <TableHead>Expense</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>Payout Preference</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead className="last:pr-4">Status</TableHead>
        </TableHeader>
        <TableBody className="flex flex-col gap-4">
          {rows.map((row) => (
            <TableRow
              key={row.id}
              className="h-14 rounded-[12px] border-0 bg-[#f6f6f6] [&>*]:py-0"
            >
              <TableCell className="first:pl-4">{row.name}</TableCell>
              <TableCell>{row.purpose}</TableCell>
              <TableCell>
                <DescriptionCell
                  value={row.description ?? ""}
                  onOpenUrl={setPendingUrl}
                />
              </TableCell>
              <TableCell>{formatAmount(row.expense, { showDust: true })}</TableCell>
              <TableCell>
                <PayoutRecipientCell address={row.address} />
              </TableCell>
              <TableCell>
                {row.token} · {chainDisplayName(row.network)}
              </TableCell>
              <TableCell>{formatAmount(row.amount, { prefix: "", showDust: true })}</TableCell>
              <TableCell className="last:pr-4">
                <StatusCell row={row} />
              </TableCell>
            </TableRow>
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
