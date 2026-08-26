import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_SIZE, BUTTON_VARIANT } from "@/components/ui/button/config";
import { Switch } from "@/components/ui/switch/Switch";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
} from "@/components/ui/table/Table";
import { RECEIVED_PAYMENT_TABLE_COLUMNS, REQUEST_LIST_REFRESH_MS } from "../../config";
import { canWithdrawRequest, type ReceivedPaymentView } from "../../request-utils";
import { ReceivedPaymentRow } from "./ReceivedPaymentRow";

export function ReceivedPaymentList(props: {
  rows: ReceivedPaymentView[];
  pendingWithdrawCount: number;
  withdrawingId?: number | null;
  loading?: boolean;
  error?: string | null;
  refreshing?: boolean;
  onRefresh: () => Promise<unknown>;
  onWithdraw: (row: ReceivedPaymentView) => void;
  onDelete: (row: ReceivedPaymentView) => void;
}) {
  const {
    rows,
    pendingWithdrawCount,
    withdrawingId = null,
    loading = false,
    error = null,
    refreshing = false,
    onRefresh,
    onWithdraw,
    onDelete,
  } = props;
  const [onlyPending, setOnlyPending] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    const id = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(id);
  }, [cooldownUntil]);

  const cooldownSec = Math.max(0, Math.ceil((cooldownUntil - now) / 1_000));
  const refreshDisabled = cooldownSec > 0;

  const visible = useMemo(() => {
    if (!onlyPending) return rows;
    return rows.filter((row) => canWithdrawRequest(row));
  }, [onlyPending, rows]);

  async function handleRefresh() {
    if (refreshDisabled || refreshing) return;
    const started = Date.now();
    setNow(started);
    setCooldownUntil(started + REQUEST_LIST_REFRESH_MS);
    await onRefresh();
  }

  return (
    <Table
      className="mx-auto w-full max-w-[1212px]"
      columns={RECEIVED_PAYMENT_TABLE_COLUMNS}
      toolbar={
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-montserrat text-base font-medium text-black">
            Request Payment
          </h2>
          <span className="inline-flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-montserrat text-sm text-[#606060]">
              To be withdraw
              {pendingWithdrawCount > 0 ? (
                <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#6284F5] px-1 font-montserrat text-[10px] font-medium text-white">
                  {pendingWithdrawCount}
                </span>
              ) : null}
            </span>
            <Switch
              checked={onlyPending}
              onCheckedChange={setOnlyPending}
              aria-label="To be withdraw"
            />
            <Button
              type="button"
              variant={BUTTON_VARIANT.Normal}
              size={BUTTON_SIZE.Sm}
              loading={refreshing}
              disabled={refreshDisabled}
              onClick={() => {
                void handleRefresh();
              }}
              className="h-7 rounded-full px-3 text-xs"
            >
              {cooldownSec > 0 ? `Refresh ${cooldownSec}s` : "Refresh"}
            </Button>
          </span>
        </div>
      }
    >
      <TableHeader className="border-b-0">
        <TableHead className="first:pl-3">Payment Name</TableHead>
        <TableHead>Request Payment</TableHead>
        <TableHead>Receive Address</TableHead>
        <TableHead>Paid Address</TableHead>
        <TableHead>Paid Time</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="justify-end last:pr-4" />
      </TableHeader>
      <TableBody className="flex flex-col gap-3.5">
        {loading && rows.length === 0 ? (
          <p className="py-8 text-center font-montserrat text-sm text-[#909090]">Loading received payments…</p>
        ) : error && rows.length === 0 ? (
          <p className="py-8 text-center font-montserrat text-sm text-danger">{error}</p>
        ) : visible.length === 0 ? (
          <p className="py-8 text-center font-montserrat text-sm text-[#909090]">No received payments yet</p>
        ) : (
          visible.map((row) => (
            <ReceivedPaymentRow
              key={row.id}
              row={row}
              withdrawing={withdrawingId === row.id}
              withdrawDisabled={Boolean(withdrawingId)}
              onWithdraw={() => onWithdraw(row)}
              onDelete={() => onDelete(row)}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
}
