import { useState, type ReactNode } from "react";
import { IconAlert, IconAlertCircle } from "@/components/icons/alert";
import { IconCheck2 } from "@/components/icons/check";
import { IconExportLink, IconOutLink } from "@/components/icons/link";
import { IconLoading } from "@/components/icons/loading";
import { IconPayroll } from "@/components/icons/payroll";
import { IconPayoutPending } from "@/components/icons/payout-status";
import { IconUp } from "@/components/icons/up";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_SIZE, BUTTON_VARIANT } from "@/components/ui/button/config";
import { Drawer } from "@/components/ui/drawer/Drawer";
import { DRAWER_SIDE } from "@/components/ui/drawer/config";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { chainDisplayName, txExplorerUrl } from "@/config/chains";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePayrollHistoryDetailQuery } from "@/hooks/use-payroll-api";
import { useRetryPayrollPayoutMutation } from "@/hooks/use-single-payout-api";
import useToast from "@/hooks/use-toast";
import { organizationId } from "@/lib/auth-role";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import type {
  PayrollHistoryDetailRow,
  PayrollHistoryRun
} from "@/types/payroll";
import { formatAmount } from "@/utils";
import { PayoutRecipientCell } from "@/views/pay/components/payout-table/PayoutRecipientCell";
import {
  PAYROLL_HISTORY_DETAIL_COLUMNS,
  PAYROLL_HISTORY_DETAIL_DELTA_DOWN_CLASS,
  PAYROLL_HISTORY_DETAIL_DELTA_UP_CLASS,
  PAYROLL_HISTORY_DETAIL_DESKTOP_QUERY,
  PAYROLL_HISTORY_DETAIL_FAILED_CLASS,
  PAYROLL_HISTORY_DETAIL_FAILED_COPY,
  PAYROLL_HISTORY_DETAIL_GRID,
  PAYROLL_HISTORY_DETAIL_PAID_CLASS,
  PAYROLL_PAYOUT_STATUS,
  PAYROLL_STATUS_FAILED_CLASS,
  PAYROLL_STATUS_PENDING_CLASS,
  payrollHistoryDetailPath
} from "../../config";
import { payrollExecutionItemId } from "../../utils";

function queryErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function PayrollHistoryDetailDrawer(props: {
  open: boolean;
  run: PayrollHistoryRun | null;
  onClose: () => void;
}) {
  const { open, run, onClose } = props;
  const isDesktop = useMediaQuery(PAYROLL_HISTORY_DETAIL_DESKTOP_QUERY);
  const detail = usePayrollHistoryDetailQuery(open ? (run?.id ?? null) : null);
  const summary = detail.data ?? run;
  const rows = detail.data?.rows ?? [];
  const title = summary?.title ?? "";

  function handleExport() {
    if (!summary) return;
    const header = "name,address,email,token,network,amount,net_pay,status";
    const lines = rows.map((row) =>
      [
        row.name,
        row.address,
        row.email,
        row.token,
        row.network,
        row.amount,
        row.netPay,
        row.status
      ].join(",")
    );
    const blob = new Blob([[header, ...lines].join("\n")], {
      type: "text/csv;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, "-") || "payroll-history"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side={isDesktop ? DRAWER_SIDE.Right : DRAWER_SIDE.Bottom}
      title={
        summary ? (
          <>
            <span className="inline-flex h-[30px] shrink-0 items-center gap-1 rounded-[8px] border border-black/10 bg-[#f6f6f6] px-2 text-[#606060]">
              <IconPayroll className="size-3 shrink-0" />
              <span className="font-montserrat text-sm font-medium">
                Payroll
              </span>
            </span>
            <span className="min-w-0 truncate">{title}</span>
          </>
        ) : null
      }
      titleClassName="flex min-w-0 flex-1 items-center gap-2.5"
      headerAction={
        summary && !detail.isLoading && !detail.isError ? (
          <Button
            variant={BUTTON_VARIANT.Normal}
            size={BUTTON_SIZE.Sm}
            className="h-8 rounded-[10px] border-black/10 bg-white px-3 text-xs capitalize text-black"
            onClick={handleExport}
          >
            <IconExportLink className="size-3.5 shrink-0" />
            Export CSV
          </Button>
        ) : null
      }
      panelClassName={isDesktop ? "w-[min(100%,860px)]" : undefined}
      cardClassName={cn(
        "gap-6 p-[30px] sm:p-10",
        !isDesktop && "w-full max-h-[90vh] rounded-b-none"
      )}
    >
      {summary ? (
        <HistoryDetailBody
          run={summary}
          rows={rows}
          loading={detail.isLoading}
          error={
            detail.isError
              ? queryErrorMessage(
                  detail.error,
                  "Failed to load payroll history detail"
                )
              : null
          }
        />
      ) : null}
    </Drawer>
  );
}

function HistoryDetailBody(props: {
  run: PayrollHistoryRun;
  rows: PayrollHistoryDetailRow[];
  loading: boolean;
  error: string | null;
}) {
  const { run, rows, loading, error } = props;
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const orgId = organizationId(user);
  const retryPayout = useRetryPayrollPayoutMutation();
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const failedCount =
    run.failedCount > 0
      ? run.failedCount
      : rows.filter((row) => row.status === PAYROLL_PAYOUT_STATUS.Failed)
          .length;

  async function handlePayAgain(row: PayrollHistoryDetailRow) {
    const itemId = payrollExecutionItemId(row.id);
    if (itemId == null) {
      toast.fail({ title: "Payment item is missing" });
      return;
    }
    if (orgId == null) {
      toast.fail({ title: "Organization is missing" });
      return;
    }
    try {
      setRetryingId(row.id);
      const payment = await retryPayout.mutateAsync({
        execution_item_id: itemId,
        organization_id: orgId,
        success_url: `${window.location.origin}${payrollHistoryDetailPath(run.id)}`,
      });
      window.location.assign(payment.payUrl);
    } catch (error) {
      setRetryingId(null);
      toast.fail({
        title: queryErrorMessage(error, "Unable to create the payment"),
      });
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 rounded-[12px] border border-white bg-[#fdfdfd] px-4 py-4 shadow-[0_0_20px_0_rgba(0,0,0,0.06)] sm:grid-cols-4 sm:px-8">
        <SummaryCell
          label="Total Payout"
          value={formatAmount(run.totalPayout)}
        />
        <SummaryCell label="Recipients" value={String(run.recipientCount)} />
        <SummaryCell
          label="Transactions"
          value={
            <span className="inline-flex items-center gap-1.5">
              {run.transactionCount}
              {failedCount > 0 ? (
                <>
                  <IconAlertCircle
                    className={cn(
                      "size-4 shrink-0",
                      PAYROLL_STATUS_FAILED_CLASS
                    )}
                  />
                  <span className={PAYROLL_STATUS_FAILED_CLASS}>
                    {failedCount} Failed
                  </span>
                </>
              ) : null}
            </span>
          }
        />
        <SummaryCell
          label="Execution Time"
          value={formatExecutionDate(run.executedAt)}
        />
      </div>

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <IconLoading className="size-5 animate-spin text-[#909090]" />
        </div>
      ) : error ? (
        <p className="font-montserrat text-sm text-danger">{error}</p>
      ) : rows.length === 0 ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <p className="font-montserrat text-sm text-[#aaa]">No recipients</p>
        </div>
      ) : (
        <div className="min-h-0 flex-1">
          <div className={cn(PAYROLL_HISTORY_DETAIL_GRID, "px-4 pb-2")}>
            {PAYROLL_HISTORY_DETAIL_COLUMNS.map((column) => (
              <p
                key={column.key}
                className="font-montserrat text-sm font-medium capitalize text-[#aaa]"
              >
                {column.label}
              </p>
            ))}
          </div>
          <div className="flex flex-col gap-3.5">
            {rows.map((row) => (
              <HistoryDetailRow
                key={row.id}
                row={row}
                payAgainLoading={retryingId === row.id}
                onPayAgain={() => {
                  void handlePayAgain(row);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryDetailRow(props: {
  row: PayrollHistoryDetailRow;
  payAgainLoading: boolean;
  onPayAgain: () => void;
}) {
  const { row, payAgainLoading, onPayAgain } = props;
  const adjustment = netPayAdjustment(row.amount, row.netPay);

  return (
    <div
      className={cn(
        PAYROLL_HISTORY_DETAIL_GRID,
        "h-14 rounded-[12px] bg-[#f6f6f6] px-4"
      )}
    >
      <div className="min-w-0">
        <p className="truncate font-montserrat text-sm font-medium text-black">
          {row.name}
        </p>
        {row.email ? (
          <p className="truncate font-montserrat text-xs font-medium text-[#aaa]">
            {row.email}
          </p>
        ) : null}
      </div>
      <div className="min-w-0 font-montserrat text-sm font-medium text-black">
        <PayoutRecipientCell address={row.address} prefix={5} suffix={5} />
      </div>
      <p className="truncate font-montserrat text-sm font-medium text-black">
        {row.token} · {chainDisplayName(row.network)}
      </p>
      <p className="font-montserrat text-sm font-medium text-black">
        {formatAmount(row.amount, { prefix: "", maxDecimals: 0 })}
      </p>
      <div className="min-w-0">
        <p className="font-montserrat text-sm font-medium text-black">
          {formatAmount(row.netPay, { prefix: "", maxDecimals: 0 })}
        </p>
        {adjustment ? (
          <p
            className={cn(
              "font-montserrat text-xs font-medium",
              adjustment.startsWith("-")
                ? PAYROLL_HISTORY_DETAIL_DELTA_DOWN_CLASS
                : PAYROLL_HISTORY_DETAIL_DELTA_UP_CLASS
            )}
          >
            {adjustment}
          </p>
        ) : null}
      </div>
      <HistoryDetailStatus
        row={row}
        payAgainLoading={payAgainLoading}
        onPayAgain={onPayAgain}
      />
    </div>
  );
}

function HistoryDetailStatus(props: {
  row: PayrollHistoryDetailRow;
  payAgainLoading: boolean;
  onPayAgain: () => void;
}) {
  const { row, payAgainLoading, onPayAgain } = props;
  if (row.status === PAYROLL_PAYOUT_STATUS.Failed) {
    return (
      <Tooltip
        side="bottom"
        leaveDelay={150}
        className="w-[293px] px-4 py-5"
        content={
          <div className="flex flex-col items-center gap-3">
            <p className="font-montserrat text-sm font-medium text-[#606060]">
              {PAYROLL_HISTORY_DETAIL_FAILED_COPY}
            </p>
            <Button
              className="h-9 w-[140px] whitespace-nowrap rounded-[10px] text-sm"
              loading={payAgainLoading}
              onClick={onPayAgain}
            >
              {payAgainLoading ? null : <IconUp className="size-3.5 shrink-0" />}
              Pay Again
            </Button>
          </div>
        }
      >
        <span
          className={cn(
            "cursor-pointer inline-flex h-[26px] items-center gap-1 rounded-[15px] border border-[rgba(255,83,83,0.5)] bg-white px-2",
            PAYROLL_HISTORY_DETAIL_FAILED_CLASS
          )}
        >
          <IconAlert className="h-2.5 w-1 shrink-0" />
          Failed
        </span>
      </Tooltip>
    );
  }

  const explorerUrl = txExplorerUrl(row.network, row.txHash);

  if (row.status !== PAYROLL_PAYOUT_STATUS.Paid) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5",
          PAYROLL_STATUS_PENDING_CLASS
        )}
      >
        <IconPayoutPending className="size-4 shrink-0" />
        Pending
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        PAYROLL_HISTORY_DETAIL_PAID_CLASS
      )}
    >
      <IconCheck2 className="size-3.5 shrink-0" />
      Paid
      {explorerUrl ? (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-black"
          aria-label="View transaction"
        >
          <IconOutLink className="size-2.5" />
        </a>
      ) : (
        <IconOutLink className="size-2.5 text-black" />
      )}
    </span>
  );
}

function SummaryCell(props: { label: string; value: string | ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="font-montserrat text-sm font-medium capitalize text-[#aaa]">
        {props.label}
      </p>
      <p className="mt-1.5 truncate font-montserrat text-sm font-medium text-black">
        {props.value}
      </p>
    </div>
  );
}

function netPayAdjustment(amount: string, netPay: string): string | null {
  const delta = Number(netPay) - Number(amount);
  if (!Number.isFinite(delta) || delta === 0) return null;
  const formatted = formatAmount(Math.abs(delta), {
    prefix: "",
    maxDecimals: 0
  });
  return delta > 0 ? `+${formatted}` : `-${formatted}`;
}

function formatExecutionDate(value: string): string {
  const isoDate = value.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoDate) return isoDate[1];
  return value || "-";
}
