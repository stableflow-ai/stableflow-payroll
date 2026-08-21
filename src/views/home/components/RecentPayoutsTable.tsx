import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/Table";
import { IconCheck2 } from "@/components/icons/check";
import { IconOutLink } from "@/components/icons/link";
import { formatAddress, formatAmount, formatDate } from "@/utils";
import { PAYOUT_STATUS, type RecentPayout } from "@/mocks/home";
import {
  HOME_STATUS_COMPLETE_CLASS,
  HOME_STATUS_FAILED_CLASS,
  RECENT_PAYOUTS_COLUMNS,
} from "../config";
import { ViewAllLink } from "./ViewAllLink";

function StatusCell({ item }: { item: RecentPayout }) {
  if (item.status === PAYOUT_STATUS.Failed) {
    return <span className={`font-montserrat text-sm font-medium ${HOME_STATUS_FAILED_CLASS}`}>Failed</span>;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-montserrat text-sm font-medium ${HOME_STATUS_COMPLETE_CLASS}`}>
      Complete
      <IconCheck2 className={HOME_STATUS_COMPLETE_CLASS} />
      {item.txUrl ? (
        <a
          href={item.txUrl}
          target="_blank"
          rel="noreferrer"
          className={HOME_STATUS_COMPLETE_CLASS}
          aria-label="View transaction"
        >
          <IconOutLink />
        </a>
      ) : null}
    </span>
  );
}

export function RecentPayoutsTable({ items }: { items: RecentPayout[] }) {
  return (
    <Table columns={RECENT_PAYOUTS_COLUMNS}>
      <div className="mb-4 flex min-w-max items-center justify-between gap-3">
        <h2 className="font-montserrat text-lg font-medium capitalize text-black">
          Recent Payouts
        </h2>
        <ViewAllLink to="/pay/history" />
      </div>
      <TableHeader>
        <TableHead>Recipient</TableHead>
        <TableHead>Amount</TableHead>
        <TableHead>Amount</TableHead>
        <TableHead>Time</TableHead>
        <TableHead>Status</TableHead>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{formatAddress(item.recipient)}</TableCell>
            <TableCell>{formatAmount(item.amount, { prefix: "" })}</TableCell>
            <TableCell>
              {item.symbol} · {item.network}
            </TableCell>
            <TableCell>{formatDate(item.time)}</TableCell>
            <TableCell>
              <StatusCell item={item} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
