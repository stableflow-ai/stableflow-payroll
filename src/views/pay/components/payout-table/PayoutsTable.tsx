import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/Table";
import { chainDisplayName } from "@/config/chains";
import { formatAmount, formatDate } from "@/utils";
import { PAYOUT_TABLE_COLUMNS } from "../../config";
import { PayoutMemoCell } from "./PayoutMemoCell";
import { PayoutRecipientCell } from "./PayoutRecipientCell";
import { PayoutStatusCell, type PayoutRowStatus } from "./PayoutStatusCell";

export type PayoutTableRow = {
  id: string;
  recipient: string;
  amount: string;
  token: string;
  network: string;
  memo?: string | null;
  time: string;
  status: PayoutRowStatus;
  explorerUrl?: string | null;
};

export function PayoutsTable(props: {
  rows: PayoutTableRow[];
  empty: string;
  className?: string;
}) {
  const { rows, empty, className } = props;

  return (
    <Table className={className} columns={PAYOUT_TABLE_COLUMNS}>
      <TableHeader>
        <TableHead>Recipient</TableHead>
        <TableHead>Amount</TableHead>
        <TableHead>Asset</TableHead>
        <TableHead>Memo</TableHead>
        <TableHead>Time</TableHead>
        <TableHead>Status</TableHead>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <p className="py-8 font-montserrat text-sm text-[#909090] text-center">{empty}</p>
        ) : (
          rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <PayoutRecipientCell address={row.recipient} />
              </TableCell>
              <TableCell>{formatAmount(row.amount, { prefix: "", showDust: true })}</TableCell>
              <TableCell>
                {row.token} · {chainDisplayName(row.network)}
              </TableCell>
              <TableCell>
                <PayoutMemoCell memo={row.memo} />
              </TableCell>
              <TableCell>{formatDate(row.time)}</TableCell>
              <TableCell>
                <PayoutStatusCell status={row.status} explorerUrl={row.explorerUrl} />
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
