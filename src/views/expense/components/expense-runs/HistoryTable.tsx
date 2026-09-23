import { useState } from "react";
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
import { TableSkeletonRows } from "@/components/ui/table/TableSkeletonRows";
import { chainDisplayName, txExplorerUrl } from "@/config/chains";
import { useRetryPayoutItem } from "@/hooks/use-single-payout-api";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/utils";
import { PayoutRecipientCell } from "@/views/pay/components/payout-table/PayoutRecipientCell";
import { PayoutRetryStatus } from "@/views/pay/components/PayoutRetryStatus";
import {
  isPayoutRetryStatus,
  payoutExecutionItemId,
} from "@/views/pay/payout-retry";
import type { ExpenseHistoryRow } from "@/types/expense";
import {
  HISTORY_EXPENSE_TABLE_COLUMNS,
  EXPENSE_HISTORY_PAID_CLASS,
  EXPENSE_PAYOUT_STATUS,
  EXPENSE_STATUS_PENDING_CLASS,
} from "../../config";
import { DescriptionCell } from "./DescriptionCell";
import { ExternalLinkConfirmDialog } from "./ExternalLinkConfirmDialog";

function StatusCell(props: {
  row: ExpenseHistoryRow;
  payAgainLoading: boolean;
  onPayAgain: () => void;
}) {
  const { row, payAgainLoading, onPayAgain } = props;
  if (isPayoutRetryStatus(row.status)) {
    return (
      <PayoutRetryStatus
        status={row.status}
        canRetry={payoutExecutionItemId(row.id) != null}
        loading={payAgainLoading}
        onPayAgain={onPayAgain}
      />
    );
  }

  if (row.status !== EXPENSE_PAYOUT_STATUS.Paid) {
    return (
      <span className={cn("inline-flex items-center gap-1.5", EXPENSE_STATUS_PENDING_CLASS)}>
        <IconPayoutPending className="size-5 shrink-0 animate-spin" />
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

export function HistoryTable(props: {
  rows: ExpenseHistoryRow[];
  successPath: string;
  amountLabel?: string;
  descriptionLabel?: string;
  loading?: boolean;
}) {
  const {
    rows,
    successPath,
    amountLabel = "Expense",
    descriptionLabel = "Description / Receipt",
    loading = false,
  } = props;
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const { retryItem, retryingId } = useRetryPayoutItem();

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
          <TableHead className="normal-case">{descriptionLabel}</TableHead>
          <TableHead>{amountLabel}</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>Payout Preference</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead className="last:pr-4">Status</TableHead>
        </TableHeader>
        {loading ? (
          <TableSkeletonRows cells={8} />
        ) : (
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
                <StatusCell
                  row={row}
                  payAgainLoading={retryingId === row.id}
                  onPayAgain={() => {
                    void retryItem(row.id, successPath);
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        )}
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
