import { IconAlert } from "@/components/icons/alert";
import { IconUp } from "@/components/icons/up";
import { Button } from "@/components/ui/button/Button";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { cn } from "@/lib/utils";
import {
  payoutRetryCopy,
  payoutRetryLabel,
  type PayoutRetryStatusValue,
} from "../payout-retry";

const RETRY_STATUS_CLASS = "text-danger";

export function PayoutRetryStatus(props: {
  status: PayoutRetryStatusValue;
  canRetry?: boolean;
  loading?: boolean;
  onPayAgain?: () => void;
}) {
  const { status, canRetry = false, loading = false, onPayAgain } = props;
  const badge = (
    <span
      className={cn(
        "inline-flex h-[26px] items-center gap-1 rounded-[15px] border border-[rgba(255,83,83,0.5)] bg-white px-2",
        canRetry && "cursor-pointer",
        RETRY_STATUS_CLASS,
      )}
    >
      <IconAlert className="h-2.5 w-1 shrink-0" />
      {payoutRetryLabel(status)}
    </span>
  );

  if (!canRetry || !onPayAgain) return badge;

  return (
    <Tooltip
      side="bottom"
      leaveDelay={150}
      className="w-[293px] px-4 py-5"
      content={
        <div className="flex flex-col items-center gap-3">
          <p className="font-montserrat text-sm font-medium text-[#606060]">
            {payoutRetryCopy(status)}
          </p>
          <Button
            className="h-9 w-[140px] whitespace-nowrap rounded-[10px] text-sm"
            loading={loading}
            onClick={onPayAgain}
          >
            {loading ? null : <IconUp className="size-3.5 shrink-0" />}
            Pay Again
          </Button>
        </div>
      }
    >
      {badge}
    </Tooltip>
  );
}
