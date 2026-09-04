import { IconLink, IconOutLink } from "@/components/icons/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/Table";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { cn } from "@/lib/utils";
import useToast from "@/hooks/use-toast";
import { formatAmount, formatAddress, formatDate } from "@/utils";
import {
  PAY_REQUEST_STATUS,
  PAYMENT_NAME_ELLIPSIS_PREFIX,
  PAYMENT_NAME_ELLIPSIS_SUFFIX,
  REQUESTS_TABLE_COLUMNS,
} from "../../config";
import {
  buildPaymentRequestUrl,
  receivedPaymentStatusClass,
  receivedPaymentStatusLabel,
  requestStatusExplorerUrl,
  truncateMiddle,
  type ReceivedPaymentView,
} from "../../request-utils";

export function RequestsTable(props: {
  rows: ReceivedPaymentView[];
  loading?: boolean;
  error?: string | null;
}) {
  const { rows, loading = false, error = null } = props;

  return (
    <Table
      columns={REQUESTS_TABLE_COLUMNS}
      toolbar={
        <h2 className="mb-4 font-montserrat text-base font-medium text-black">
          Request Payment
        </h2>
      }
    >
      <TableHeader className="border-b-0">
        <TableHead className="first:pl-3">Purpose</TableHead>
        <TableHead>Request Payment</TableHead>
        <TableHead>Receive Address</TableHead>
        <TableHead>Paid Address</TableHead>
        <TableHead>Paid Time</TableHead>
        <TableHead>Status</TableHead>
      </TableHeader>
      <TableBody className="flex flex-col gap-3.5">
        {loading && rows.length === 0 ? (
          <p className="py-8 text-center font-montserrat text-sm text-[#909090]">Loading requests…</p>
        ) : error && rows.length === 0 ? (
          <p className="py-8 text-center font-montserrat text-sm text-danger">{error}</p>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center font-montserrat text-sm text-[#909090]">No requests yet</p>
        ) : (
          rows.map((row) => <RequestRow key={row.id} row={row} />)
        )}
      </TableBody>
    </Table>
  );
}

function RequestRow(props: { row: ReceivedPaymentView }) {
  const { row } = props;
  const toast = useToast();
  const amountLabel = `${formatAmount(row.amount, { prefix: "", maxDecimals: 6 })} ${row.symbol} · ${row.network}`;
  const statusLabel = receivedPaymentStatusLabel(row);
  const explorerUrl = requestStatusExplorerUrl(row);
  const createdLabel = formatDate(row.createdAt);
  const paidTimeLabel = formatDate(row.paidAt);
  const paymentName = row.paymentName.trim();

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(buildPaymentRequestUrl(window.location.origin, row.id));
      toast.success({ title: "Copied" });
    } catch {
      toast.fail({ title: "Could not copy" });
    }
  }

  return (
    <TableRow className="h-14 rounded-[12px] border-0 bg-[#f6f6f6]">
      <TableCell className="py-2 first:pl-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5">
            {paymentName ? (
              <Tooltip content={paymentName} triggerClassName="min-w-0">
                <p className="truncate font-montserrat text-sm font-medium text-black">
                  {truncateMiddle(
                    paymentName,
                    PAYMENT_NAME_ELLIPSIS_PREFIX,
                    PAYMENT_NAME_ELLIPSIS_SUFFIX,
                  )}
                </p>
              </Tooltip>
            ) : (
              <p className="truncate font-montserrat text-sm font-medium text-black">-</p>
            )}
            <button
              type="button"
              className="inline-flex size-4 shrink-0 cursor-pointer items-center justify-center text-[#909090] hover:text-black"
              aria-label="Copy payment link"
              onClick={() => {
                void copyLink();
              }}
            >
              <IconLink className="size-3.5" />
            </button>
          </div>
          {createdLabel ? (
            <p className="mt-0.5 truncate font-montserrat text-xs font-medium text-[#aaa]">
              {createdLabel}
            </p>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="py-2 text-sm font-medium text-black">{amountLabel}</TableCell>
      <TableCell className="py-2 text-sm font-medium text-black">
        {row.address.trim() ? formatAddress(row.address, 6, 5) : "-"}
      </TableCell>
      <TableCell className="py-2 text-sm font-medium text-black">
        {row.paidAddress.trim() ? formatAddress(row.paidAddress, 6, 5) : "-"}
      </TableCell>
      <TableCell className="py-2 text-sm font-medium text-black">
        {paidTimeLabel || "-"}
      </TableCell>
      <TableCell className="py-2 last:pr-4">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <span
            className={cn(
              "font-montserrat text-sm font-medium",
              receivedPaymentStatusClass(row.status),
            )}
          >
            {statusLabel}
          </span>
          {row.status === PAY_REQUEST_STATUS.Completed && explorerUrl ? (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-black"
              aria-label="View transaction"
            >
              <IconOutLink />
            </a>
          ) : null}
        </span>
      </TableCell>
    </TableRow>
  );
}
