import { IconPen } from "@/components/icons/pen";
import { IconUp } from "@/components/icons/up";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_VARIANT } from "@/components/ui/button/config";
import { InputNumber } from "@/components/ui/input-number/InputNumber";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/Table";
import { chainDisplayName } from "@/config/chains";
import { formatAmount } from "@/utils";
import type { PayrollNextRun } from "@/mocks/payroll";
import { NEXT_PAYROLL_TABLE_COLUMNS } from "../../config";
import { PayoutRecipientCell } from "@/views/pay/components/payout-table/PayoutRecipientCell";

export function NextPayrollPanel(props: {
  run: PayrollNextRun;
  netPayById: Record<string, string>;
  onNetPayChange: (id: string, value: string) => void;
  onEdit: () => void;
  onPayNow: () => void;
}) {
  const { run, netPayById, onNetPayChange, onEdit, onPayNow } = props;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-8">
          <div>
            <p className="font-montserrat text-sm font-medium text-[#606060]">Total Payout</p>
            <p className="mt-1.5 font-montserrat text-[20px] font-semibold text-black">
              {formatAmount(run.totalPayout)}
            </p>
          </div>
          <div>
            <p className="font-montserrat text-sm font-medium text-[#606060]">Recipients</p>
            <p className="mt-1.5 font-montserrat text-[20px] font-semibold text-black">
              {run.recipients}
            </p>
          </div>
          <div>
            <p className="font-montserrat text-sm font-medium text-[#606060]">Next Pay-date</p>
            <p className="mt-1.5 font-montserrat text-[20px] font-semibold text-black">
              {run.payDate}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant={BUTTON_VARIANT.Normal}
            className="h-9 min-w-[80px] rounded-[10px] border-black/10 px-4 text-sm text-black"
            onClick={onEdit}
          >
            <IconPen className="size-3 shrink-0" />
            Edit
          </Button>
          <Button
            className="h-9 min-w-[123px] rounded-[10px] px-4 text-sm"
            onClick={onPayNow}
          >
            <IconUp className="size-3.5 shrink-0" />
            Pay Now
          </Button>
        </div>
      </div>
      <Table columns={NEXT_PAYROLL_TABLE_COLUMNS} className="border-0 bg-transparent p-0 shadow-none">
        <TableHeader className="border-b-0 bg-transparent">
          <TableHead>Name</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>Payout Preference</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead className="capitalize">Net Pay</TableHead>
        </TableHeader>
        <TableBody className="flex flex-col gap-3.5">
          {run.rows.map((row) => (
            <TableRow
              key={row.id}
              className="h-14 rounded-[12px] border-0 bg-[#f6f6f6] px-4"
            >
              <TableCell>{row.name}</TableCell>
              <TableCell>
                <PayoutRecipientCell address={row.address} prefix={5} suffix={5} />
              </TableCell>
              <TableCell>
                {row.token} · {chainDisplayName(row.network)}
              </TableCell>
              <TableCell>{formatAmount(row.amount, { prefix: "" })}</TableCell>
              <TableCell>
                <InputNumber
                  value={formatAmount(netPayById[row.id] ?? row.netPay, { prefix: "" })}
                  onNumberChange={(value) => onNetPayChange(row.id, value)}
                  className="h-9 w-[99px] rounded-[6px] border border-[#e3e3e3] bg-white px-3 font-montserrat text-sm font-medium text-black outline-none"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
