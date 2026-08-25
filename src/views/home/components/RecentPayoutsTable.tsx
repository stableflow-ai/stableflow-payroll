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
import { chainDisplayName, txExplorerUrl } from "@/config/chains";
import { formatAddress, formatAmount, formatDate } from "@/utils";
import type { PayPaymentItem } from "@/types/payout";
import {
  PAYOUT_ROW_STATUS,
  paymentRowStatus,
} from "@/views/pay/components/payout-table/PayoutStatusCell";
import {
  paymentDisplayAmount,
  paymentDisplayNetwork,
  paymentDisplayToken,
} from "@/views/pay/utils";
import {
  HOME_STATUS_COMPLETE_CLASS,
  HOME_STATUS_FAILED_CLASS,
  RECENT_PAYOUTS_COLUMNS,
} from "../config";
import { ViewAllLink } from "./ViewAllLink";
import { IconLoading } from "@/components/icons";

function StatusCell({ item }: { item: PayPaymentItem }) {
  const status = paymentRowStatus(item.status);
  const explorer = txExplorerUrl(paymentDisplayNetwork(item), item.destinationTxHash);
  if (status === PAYOUT_ROW_STATUS.Failed) {
    return <span className={`font-montserrat text-sm font-medium ${HOME_STATUS_FAILED_CLASS}`}>Failed</span>;
  }
  if (status === PAYOUT_ROW_STATUS.Pending) {
    return <span className="font-montserrat text-sm font-medium text-[#6284F5]">Pending</span>;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-montserrat text-sm font-medium ${HOME_STATUS_COMPLETE_CLASS}`}>
      <IconCheck2 className={HOME_STATUS_COMPLETE_CLASS} />
      Complete
      {explorer ? (
        <a
          href={explorer}
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

export function RecentPayoutsTable({ items, loading }: { items: PayPaymentItem[]; loading?: boolean; }) {
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
        {
          loading ? (
            <div className="w-full py-8 flex justify-center items-center">
              <IconLoading className="size-6 animate-spin text-[#909090]" />
            </div>
          ) : (
            items.length > 0 ? items.map((item, index) => (
              <TableRow key={item.id || `${item.recipient}-${index}`}>
                <TableCell>{formatAddress(item.recipient)}</TableCell>
                <TableCell>{formatAmount(paymentDisplayAmount(item), { prefix: "" })}</TableCell>
                <TableCell>
                  {paymentDisplayToken(item)} · {chainDisplayName(paymentDisplayNetwork(item))}
                </TableCell>
                <TableCell>{formatDate(item.submittedAt)}</TableCell>
                <TableCell>
                  <StatusCell item={item} />
                </TableCell>
              </TableRow>
            )) : (
              <div className="w-full flex justify-center items-center py-8 font-montserrat text-sm text-[#909090] text-center">
                No payout yet
              </div>
            )
          )
        }
      </TableBody>
    </Table>
  );
}
