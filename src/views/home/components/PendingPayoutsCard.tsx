import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card/Card";
import { IconArrowDown } from "@/components/icons/arrow-down";
import { IconLoading } from "@/components/icons/loading";
import { chainDisplayName } from "@/config/chains";
import { formatAddress, formatAmount } from "@/utils";
import type { PayPaymentItem } from "@/types/payout";
import {
  paymentDisplayAmount,
  paymentDisplayNetwork,
  paymentDisplayToken,
} from "@/views/pay/utils";
import { ViewAllLink } from "./ViewAllLink";

const PENDING_HREF = "/pay/pending";

export function PendingPayoutsCard({ items, loading }: { items: PayPaymentItem[]; loading?: boolean; }) {
  return (
    <Card className="flex min-h-[388px] flex-col">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-montserrat text-base font-medium capitalize text-black">
          Pending Payouts
        </h2>
        <ViewAllLink to={PENDING_HREF} />
      </div>
      <ul className="mt-4 flex flex-col">
        {
          loading ? (
            <div className="flex justify-center items-center py-8">
              <IconLoading className="size-3.5 text-[#909090] animate-spin" />
            </div>
          ) : (
            items.length > 0 ? items.map((item) => (
              <li key={item.id || item.submittedAt} className="border-b border-black/10 last:border-b-0">
                <Link
                  to={PENDING_HREF}
                  className="flex items-center gap-2.5 py-3.5"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#4DA0FF]">
                    <IconLoading className="size-3.5 text-white animate-spin" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-montserrat text-sm font-medium text-black">
                      {formatAmount(paymentDisplayAmount(item), { prefix: "" })} {paymentDisplayToken(item)} · {chainDisplayName(paymentDisplayNetwork(item))}
                    </span>
                    <span className="mt-0.5 block font-montserrat text-[10px] text-[#606060]">
                      To {formatAddress(item.recipient)}
                    </span>
                  </span>
                  <IconArrowDown className="-rotate-90 text-black" />
                </Link>
              </li>
            )) : (
              <div className="flex justify-center items-center py-8 font-montserrat text-sm text-[#909090] text-center">
                No pending payouts
              </div>
            )
          )
        }
      </ul>
    </Card>
  );
}
