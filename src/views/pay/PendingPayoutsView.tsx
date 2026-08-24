import { PayoutsTable } from "./components/payout-table/PayoutsTable";
import { PAYOUT_ROW_STATUS } from "./components/payout-table/PayoutStatusCell";
import { usePendingPaymentsQuery } from "@/hooks/use-pending-payments";
import type { PayPending } from "@/types/payout";

function pendingRowId(row: PayPending, index: number) {
  return row.id || [row.recipient, row.submittedAt, row.amount, row.token, row.network, index].join("|");
}

export function PendingPayoutsView() {
  const query = usePendingPaymentsQuery();
  const rows = (query.data ?? []).map((item, index) => ({
    id: pendingRowId(item, index),
    recipient: item.recipient,
    amount: item.amount,
    token: item.token,
    network: item.network,
    memo: item.memo,
    time: item.submittedAt,
    status: PAYOUT_ROW_STATUS.Pending,
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
