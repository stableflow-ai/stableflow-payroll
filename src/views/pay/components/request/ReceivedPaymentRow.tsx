import { Button } from "@/components/ui/button/Button";
import { BUTTON_SIZE, BUTTON_VARIANT } from "@/components/ui/button/config";
import { TableCell, TableRow } from "@/components/ui/table/Table";
import { IconDelete } from "@/components/icons/delete";
import { IconGuard } from "@/components/icons/guard";
import { IconLink, IconOutLink } from "@/components/icons/link";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { cn } from "@/lib/utils";
import useToast from "@/hooks/use-toast";
import { formatAmount, formatDate } from "@/utils";
import { PayoutRecipientCell } from "../payout-table/PayoutRecipientCell";
import {
  buildPaymentRequestUrl,
  canWithdrawRequest,
  receivedPaymentStatusLabel,
  requestStatusExplorerUrl,
  truncateMiddle,
  type ReceivedPaymentView,
} from "../../request-utils";
import {
  PAY_REQUEST_STATUS,
  PAYMENT_NAME_ELLIPSIS_PREFIX,
  PAYMENT_NAME_ELLIPSIS_SUFFIX,
} from "../../config";

export function ReceivedPaymentRow(props: {
  row: ReceivedPaymentView;
  withdrawing?: boolean;
  withdrawDisabled?: boolean;
  onWithdraw: () => void;
  onDelete: () => void;
}) {
  const { row, withdrawing = false, withdrawDisabled = false, onWithdraw, onDelete } = props;
  const toast = useToast();
  const amountLabel = `${formatAmount(row.amount, { prefix: "", maxDecimals: 6 })} ${row.symbol} · ${row.network}`;
  const showWithdraw = canWithdrawRequest(row);
  const showPendingActions = row.status === PAY_REQUEST_STATUS.Pending;
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
            <p className="truncate font-montserrat text-sm font-medium text-black">—</p>
          )}
          {createdLabel ? (
            <p className="mt-0.5 truncate font-montserrat text-xs font-medium text-[#aaa]">
              {createdLabel}
            </p>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="py-2 text-sm font-medium text-black">{amountLabel}</TableCell>
      <TableCell className="py-2">
        {row.private ? (
          <span className="inline-flex items-center gap-1 font-montserrat text-sm font-medium text-black">
            <IconGuard className="h-[18px] w-[15px] shrink-0 text-black" />
            Private
          </span>
        ) : (
          <PayoutRecipientCell address={row.address} />
        )}
      </TableCell>
      <TableCell className="py-2 text-sm font-medium text-black">
        {row.paidAddress.trim() ? <PayoutRecipientCell address={row.paidAddress} /> : "-"}
      </TableCell>
      <TableCell className="py-2 text-sm font-medium text-black">
        {paidTimeLabel || "-"}
      </TableCell>
      <TableCell className="py-2 last:pr-4">
        {showWithdraw ? (
          <Button
            type="button"
            size={BUTTON_SIZE.Sm}
            loading={withdrawing}
            disabled={withdrawDisabled}
            onClick={onWithdraw}
            className="h-8 w-[100px] rounded-[18px] text-sm"
          >
            Withdraw
          </Button>
        ) : (
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <span
              className={cn(
                "font-montserrat text-sm font-medium",
                row.status === PAY_REQUEST_STATUS.Pending
                  ? "text-[#3f8afb]"
                  : row.status === PAY_REQUEST_STATUS.Failed
                    ? "text-danger"
                    : "text-[#aaa]",
              )}
            >
              {statusLabel}
            </span>
            {explorerUrl ? (
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
        )}
      </TableCell>
      <TableCell className="justify-end gap-2 py-2 pr-3">
        {showPendingActions ? (
          <>
            <Tooltip content="Copy Payment Link">
              <button
                type="button"
                className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center text-[#909090] hover:text-black"
                aria-label="Copy Payment Link"
                onClick={() => {
                  void copyLink();
                }}
              >
                <IconLink className="size-3.5" />
              </button>
            </Tooltip>
            <Tooltip content="Delete Payment Request,  the issued link will be invalid">
              <button
                type="button"
                className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center text-[#909090] hover:text-danger"
                aria-label="Delete payment request"
                onClick={onDelete}
              >
                <IconDelete className="size-3.5" />
              </button>
            </Tooltip>
          </>
        ) : null}
      </TableCell>
    </TableRow>
  );
}
