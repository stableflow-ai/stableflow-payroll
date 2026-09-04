import { Link } from "react-router-dom";
import { IconAlertCircle } from "@/components/icons/alert";
import { IconArrowDown } from "@/components/icons/arrow-down";
import {
  IconPayoutFailed,
  IconPayoutPaid,
  IconPayoutPending,
} from "@/components/icons/payout-status";
import { Card } from "@/components/ui/card/Card";
import { chainDisplayName } from "@/config/chains";
import { cn } from "@/lib/utils";
import { formatAddress, formatAmount } from "@/utils";
import type { PayrollRecentPayout } from "@/mocks/payroll";
import {
  PAYROLL_HISTORY_PATH,
  PAYROLL_PAYOUT_STATUS,
  PAYROLL_STATUS_FAILED_CLASS,
  PAYROLL_STATUS_PAID_CLASS,
  type PayrollPayoutStatus,
} from "../../config";

function statusLabel(status: PayrollPayoutStatus) {
  if (status === PAYROLL_PAYOUT_STATUS.Failed) return "Failed";
  if (status === PAYROLL_PAYOUT_STATUS.Paid) return "Paid";
  return "Pending";
}

function StatusMark({ status }: { status: PayrollPayoutStatus }) {
  if (status === PAYROLL_PAYOUT_STATUS.Failed) {
    return <IconPayoutFailed className={cn("size-[26px]", PAYROLL_STATUS_FAILED_CLASS)} />;
  }
  if (status === PAYROLL_PAYOUT_STATUS.Paid) {
    return <IconPayoutPaid className={cn("size-[26px]", PAYROLL_STATUS_PAID_CLASS)} />;
  }
  return <IconPayoutPending className="size-[26px] text-[#6284F5]" />;
}

function statusClass(status: PayrollPayoutStatus) {
  if (status === PAYROLL_PAYOUT_STATUS.Failed) return PAYROLL_STATUS_FAILED_CLASS;
  if (status === PAYROLL_PAYOUT_STATUS.Paid) return PAYROLL_STATUS_PAID_CLASS;
  return "text-[#06f]";
}

export function RecentPayoutsCard(props: {
  items: PayrollRecentPayout[];
  failedCount: number;
}) {
  const { items, failedCount } = props;

  return (
    <Card className="flex min-h-[454px] flex-col">
      <div className="flex items-center gap-2">
        <h2 className="font-montserrat text-lg font-medium capitalize text-black">
          Recent Payouts
        </h2>
        {failedCount > 0 ? (
          <span className="inline-flex h-7 items-center gap-1 rounded-full bg-[#E43222] pr-3 pl-2 font-montserrat text-sm font-medium text-white">
            <span className="size-4 shrink-0 overflow-clip">
              <IconAlertCircle className="size-4" />
            </span>
            {failedCount} Failed
          </span>
        ) : null}
      </div>
      {items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="font-montserrat text-sm font-normal text-[#aaa]">No recent payouts</p>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col">
          {items.map((item) => (
            <li key={item.id} className="border-b border-black/10 last:border-b-0">
              <Link
                to={PAYROLL_HISTORY_PATH}
                className="flex items-center gap-3 py-3.5"
              >
                <StatusMark status={item.status} />
                <span className="min-w-0 flex-1">
                  <span className="block font-montserrat text-sm font-medium text-black">
                    {formatAmount(item.amount, { prefix: "", showDust: true })} {item.token} ·{" "}
                    {chainDisplayName(item.network)}
                  </span>
                  <span className="mt-0.5 block font-montserrat text-[10px] text-[#606060]">
                    To {formatAddress(item.recipient, 5, 4)}
                  </span>
                </span>
                <span
                  className={cn(
                    "shrink-0 font-montserrat text-xs font-medium",
                    statusClass(item.status),
                  )}
                >
                  {statusLabel(item.status)}
                </span>
                <IconArrowDown className="-rotate-90 text-black" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
