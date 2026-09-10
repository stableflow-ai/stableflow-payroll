import { useState } from "react";
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
import {
  REQUEST_PAYMENTS_TABLE_COLUMNS,
  EXPENSE_ROW_ACTION,
} from "../../config";
import { DescriptionCell } from "./DescriptionCell";
import { ExternalLinkConfirmDialog } from "./ExternalLinkConfirmDialog";

function RowAction(props: {
  action: ExpenseOpenRow["action"];
  batchId: number;
  onPayNow: (batchId: number) => void;
}) {
  const { action, batchId, onPayNow } = props;
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

  const canPay = batchId > 0;

  return (
    <Button
      className="h-9 min-w-[130px] whitespace-nowrap rounded-[10px] px-4 text-sm"
      disabled={!canPay}
      onClick={() => {
        if (!canPay) return;
        onPayNow(batchId);
      }}
    >
      <IconUp className="size-3.5 shrink-0" />
      Pay Now
    </Button>
  );
}

export function RequestsTable(props: {
  rows: ExpenseOpenRow[];
  onPayNow: (batchId: number) => void;
}) {
  const { rows, onPayNow } = props;
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  function handleConfirmExternalLink() {
    if (!pendingUrl) return;
    window.open(pendingUrl, "_blank", "noopener,noreferrer");
    setPendingUrl(null);
  }

  return (
    <>
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
                <DescriptionCell
                  value={row.receiptName}
                  onOpenUrl={setPendingUrl}
                />
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
              <TableCell>{formatAmount(row.amount, { prefix: "", showDust: true })}</TableCell>
              <TableCell className="justify-end last:pr-4">
                <RowAction
                  action={row.action}
                  batchId={row.batchId}
                  onPayNow={onPayNow}
                />
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
