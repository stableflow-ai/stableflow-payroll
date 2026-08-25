import { Button } from "@/components/ui/button/Button";
import { BUTTON_SIZE, BUTTON_VARIANT } from "@/components/ui/button/config";
import { TableCell, TableRow } from "@/components/ui/table/Table";
import { IconCopy } from "@/components/icons/copy";
import { IconGuard } from "@/components/icons/guard";
import { tokenLogoUrl } from "@/lib/logo";
import { cn } from "@/lib/utils";
import useToast from "@/hooks/use-toast";
import { formatAddress, formatAmount, formatDate } from "@/utils";
import {
  buildPaymentRequestUrl,
  canWithdrawRequest,
  receivedPaymentStatusLabel,
  type ReceivedPaymentView,
} from "../../request-utils";
import { PAY_REQUEST_STATUS } from "../../config";

export function ReceivedPaymentRow(props: {
  row: ReceivedPaymentView;
  withdrawing?: boolean;
  withdrawDisabled?: boolean;
  onWithdraw: () => void;
}) {
  const { row, withdrawing = false, withdrawDisabled = false, onWithdraw } = props;
  const toast = useToast();
  const amountLabel = `${formatAmount(row.amount, { prefix: "", maxDecimals: 6 })} ${row.symbol} · ${row.network}`;
  const showWithdraw = canWithdrawRequest(row);
  const showCopyLink = row.status === PAY_REQUEST_STATUS.Pending;
  const statusLabel = receivedPaymentStatusLabel(row);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(buildPaymentRequestUrl(window.location.origin, row.id));
      toast.success({ title: "Copied" });
    } catch {
      toast.fail({ title: "Could not copy" });
    }
  }

  return (
    <TableRow>
      <TableCell>
        <div className="flex min-w-0 items-center gap-2">
          <img src={tokenLogoUrl(row.symbol)} alt="" className="size-5 shrink-0 rounded-full object-cover" />
          <div className="min-w-0">
            <p className="truncate font-montserrat text-sm font-medium text-black">{amountLabel}</p>
            {row.private ? (
              <span className="mt-0.5 inline-flex items-center gap-1 font-montserrat text-[10px] text-[#606060]">
                <IconGuard className="h-3 w-2.5 text-[#6284F5]" />
                Private
              </span>
            ) : null}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-[#606060]">{formatDate(row.createdAt) || "—"}</TableCell>
      <TableCell className="text-[#606060]">{formatAddress(row.address)}</TableCell>
      <TableCell>
        {showWithdraw ? (
          <Button
            type="button"
            variant={BUTTON_VARIANT.Normal}
            size={BUTTON_SIZE.Sm}
            loading={withdrawing}
            disabled={withdrawDisabled}
            onClick={onWithdraw}
            className="h-7 rounded-full px-3 text-xs"
          >
            Withdraw
          </Button>
        ) : (
          <span
            className={cn(
              "font-montserrat text-sm",
              row.status === PAY_REQUEST_STATUS.Failed
                ? "text-danger"
                : row.status === PAY_REQUEST_STATUS.Completed
                  ? "text-[#16a34a]"
                  : "text-[#909090]",
            )}
          >
            {statusLabel}
          </span>
        )}
      </TableCell>
      <TableCell className="justify-end">
        {showCopyLink ? (
          <button
            type="button"
            className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-[#909090] hover:text-black"
            aria-label="Copy payment link"
            onClick={() => {
              void copyLink();
            }}
          >
            <IconCopy className="size-3.5" />
          </button>
        ) : null}
      </TableCell>
    </TableRow>
  );
}
