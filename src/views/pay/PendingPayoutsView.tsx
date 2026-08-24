import { PayoutsTable } from "./components/payout-table/PayoutsTable";
import { PAYOUT_ROW_STATUS } from "./components/payout-table/PayoutStatusCell";
import { txExplorerUrl } from "@/config/chains";
import { usePendingPaymentsQuery } from "@/hooks/use-pending-payments";
import type { PayPaymentItem } from "@/types/payout";
import {
  paymentDisplayAmount,
  paymentDisplayNetwork,
  paymentDisplayToken,
  paymentRowId,
} from "./utils";

export function PendingPayoutsView() {
  const query = usePendingPaymentsQuery();
  const rows = (query.data ?? []).map((item: PayPaymentItem, index) => ({
    id: paymentRowId(item, index),
    recipient: item.recipient,
    amount: paymentDisplayAmount(item),
    token: paymentDisplayToken(item),
    network: paymentDisplayNetwork(item),
    memo: item.memo,
    time: item.submittedAt,
    status: PAYOUT_ROW_STATUS.Pending,
    explorerUrl: txExplorerUrl(paymentDisplayNetwork(item), item.destinationTxHash),
  }));

  if (query.isError) {
    return (
      <p className="font-montserrat text-sm text-danger">
        {query.error instanceof Error ? query.error.message : "Failed to load pending payouts"}
      </p>
    );
  }

  if (query.isPending) {
    return <p className="font-montserrat text-sm text-[#909090]">Loading pending payouts…</p>;
  }

  return <PayoutsTable rows={rows} empty="No pending payouts" />;
}
