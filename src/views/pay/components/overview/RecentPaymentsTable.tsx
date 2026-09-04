import { Link } from "react-router-dom";
import { Icon2Right } from "@/components/icons/to-right";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/Table";
import { chainDisplayName } from "@/config/chains";
import { formatAmount, formatDate } from "@/utils";
import { cn } from "@/lib/utils";
import {
  EMPLOYEE_PAYMENT_TYPE,
  type EmployeeRecentPayment,
} from "@/hooks/use-employee-overview-api";
import { PayoutRecipientCell } from "../payout-table/PayoutRecipientCell";
import { PayoutStatusCell, paymentRowStatus } from "../payout-table/PayoutStatusCell";
import { OVERVIEW_INCOME_COLOR, OVERVIEW_PAYOUT_COLOR, RECENT_PAYMENTS_COLUMNS } from "./config";

function TypeBadge({ type }: { type: EmployeeRecentPayment["type"] }) {
  const income = type === EMPLOYEE_PAYMENT_TYPE.Income;
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center justify-center rounded-[12px] px-2.5 font-montserrat text-xs font-medium",
      )}
      style={{
        color: income ? OVERVIEW_INCOME_COLOR : OVERVIEW_PAYOUT_COLOR,
        backgroundColor: income ? "rgba(124,206,0,0.2)" : "rgba(202,118,255,0.2)",
      }}
    >
      {income ? "Income" : "Payout"}
    </span>
  );
}

export function RecentPaymentsTable(props: { rows: EmployeeRecentPayment[] }) {
  const { rows } = props;

  return (
    <Table
      columns={RECENT_PAYMENTS_COLUMNS}
      toolbar={
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-montserrat text-base font-medium capitalize text-black">
            Recent Payments
          </h2>
          <Link
            to="/pay/history"
            className="inline-flex shrink-0 items-center gap-1 font-montserrat text-xs text-[#606060]"
          >
            View All
            <Icon2Right className="h-2 w-[11.5px]" />
          </Link>
        </div>
      }
    >
      <TableHeader>
        <TableHead className="first:pl-3">Type</TableHead>
        <TableHead>Purpose</TableHead>
        <TableHead>From</TableHead>
        <TableHead>To</TableHead>
        <TableHead>Amount</TableHead>
        <TableHead>Token</TableHead>
        <TableHead>Time</TableHead>
        <TableHead className="last:pr-3">Status</TableHead>
      </TableHeader>
      <TableBody className="flex flex-col gap-4 pt-1">
        {rows.length === 0 ? (
          <p className="py-8 text-center font-montserrat text-sm text-[#909090]">No payments yet</p>
        ) : (
          rows.map((row) => (
            <TableRow
              key={row.id}
              className="h-14 rounded-[12px] border-0 bg-[#f6f6f6]"
            >
              <TableCell className="first:pl-3">
                <TypeBadge type={row.type} />
              </TableCell>
              <TableCell>
                <span className="truncate">{row.purpose.trim() || "-"}</span>
              </TableCell>
              <TableCell>
                <PayoutRecipientCell address={row.from} />
              </TableCell>
              <TableCell>
                <PayoutRecipientCell address={row.to} />
              </TableCell>
              <TableCell>{formatAmount(row.amount, { prefix: "", showDust: true })}</TableCell>
              <TableCell>
                {row.token} · {chainDisplayName(row.network)}
              </TableCell>
              <TableCell>{formatDate(row.time)}</TableCell>
              <TableCell className="last:pr-3">
                <PayoutStatusCell status={paymentRowStatus(row.status)} explorerUrl={row.explorerUrl} />
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
