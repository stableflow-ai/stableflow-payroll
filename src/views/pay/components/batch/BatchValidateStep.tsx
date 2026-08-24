import { IconAlert } from "@/components/icons/alert";
import { IconDelete } from "@/components/icons/delete";
import { IconPlus } from "@/components/icons/plus";
import { IconSwap } from "@/components/icons/swap";
import { Button } from "@/components/ui/button/Button";
import { Card } from "@/components/ui/card/Card";
import { InputNumber } from "@/components/ui/input-number/InputNumber";
import { cn } from "@/lib/utils";
import type { IntentsToken } from "@/stores/intents-tokens";
import { formatAmount } from "@/utils";
import {
  AMOUNT_MAX_DECIMALS,
  IMPORT_MAX_ROWS,
  MEMO_MAX_LENGTH,
} from "../../config";
import type { BatchDraft } from "../../batch-utils";
import { amountError } from "../../batch-utils";
import { BatchFieldStatus } from "./BatchFieldStatus";
import { BatchTokenTrigger } from "./BatchTokenTrigger";
import { IconLoading } from "@/components/icons";

export function BatchValidateStep(props: {
  originToken: IntentsToken | null;
  originBalanceLabel: string;
  originBalanceLoading: boolean;
  rows: BatchDraft[];
  showErrors: boolean;
  totalAmountLabel: string;
  onOpenOriginToken: () => void;
  onOpenDestToken: (rowId: string) => void;
  onPatch: (rowId: string, patch: Partial<Pick<BatchDraft, "address" | "amount" | "memo">>) => void;
  onAdd: () => void;
  onRemove: (rowId: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const {
    originToken,
    originBalanceLabel,
    originBalanceLoading,
    rows,
    showErrors,
    totalAmountLabel,
    onOpenOriginToken,
    onOpenDestToken,
    onPatch,
    onAdd,
    onRemove,
    onBack,
    onContinue,
  } = props;

  return (
    <div>
      <Card className="w-full px-5 py-6 sm:px-8 sm:py-8">
        <h2 className="font-montserrat text-xl font-semibold text-black">Validate</h2>
        <p className="mt-2 font-montserrat text-sm text-[#606060]">Send a private payment from your organization's treasury.</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <p className="shrink-0 font-montserrat text-sm font-medium text-[#606060]">
              Paying Token & Network
            </p>
            <BatchTokenTrigger
              token={originToken}
              onClick={onOpenOriginToken}
              invalid={showErrors && !originToken}
              className="sm:w-[253px]"
            />
          </div>
          <p className="font-montserrat text-sm text-[#606060] flex items-center gap-1">
            Balance:{" "}
            <span className="text-lg font-semibold text-black">
              {originBalanceLoading ? (
                <IconLoading className="size-3 animate-spin" />
              ) : originBalanceLabel}
            </span>
          </p>
        </div>

        <div className="mt-8 hidden gap-3 font-montserrat text-sm font-medium text-[#606060] lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(160px,0.7fr)_minmax(180px,0.8fr)_minmax(120px,0.55fr)_28px]">
          <span>Recipient</span>
          <span>Amount</span>
          <span>Prefer Token, Network</span>
          <span>Memo</span>
          <span />
        </div>

        <div className="mt-3 flex flex-col gap-4 lg:gap-3">
          {rows.map((row) => (
            <BatchRow
              key={row.id}
              row={row}
              showErrors={showErrors}
              canRemove={rows.length > 1}
              onOpenDestToken={() => onOpenDestToken(row.id)}
              onPatch={(patch) => onPatch(row.id, patch)}
              onRemove={() => onRemove(row.id)}
            />
          ))}
        </div>

        <button
          type="button"
          disabled={rows.length >= IMPORT_MAX_ROWS}
          onClick={onAdd}
          className="mt-6 flex h-9 w-full items-center justify-center gap-2 rounded-[8px] border border-dashed border-black/20 font-montserrat text-sm font-medium text-black disabled:opacity-40"
        >
          <IconPlus className="size-3" />
          Add one
        </button>
      </Card>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-start gap-2 sm:items-center">
            <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-[#F5A623]/15 text-[#F5A623]">
              <IconAlert className="h-[7px] w-0.5" />
            </span>
            <p className="font-montserrat text-xs text-[#606060]">Batch quotes may lack liquidity for large totals; some recipients might fail.</p>
          </div>
          <p className="shrink-0 font-montserrat text-sm text-[#606060] flex items-center">
            Total Amount:
            <span className="ml-1 text-lg font-semibold text-black">{totalAmountLabel}</span>
          </p>
        </div>
        <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="normal" className="w-full sm:w-[152px]" onClick={onBack}>
            Back
          </Button>
          <Button className="w-full sm:w-[160px]" onClick={onContinue}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}

function BatchRow(props: {
  row: BatchDraft;
  showErrors: boolean;
  canRemove: boolean;
  onOpenDestToken: () => void;
  onPatch: (patch: Partial<Pick<BatchDraft, "address" | "amount" | "memo">>) => void;
  onRemove: () => void;
}) {
  const { row, showErrors, canRemove, onOpenDestToken, onPatch, onRemove } = props;
  const amountErr = amountError(row.amount);
  const showAddressStatus = Boolean(row.address.trim()) || showErrors;
  const addressOk = !row.addressError && Boolean(row.chainKind);
  const showAmountStatus = Boolean(row.amount.trim()) || showErrors;
  const amountOk = !amountErr;
  const tokenInvalid = showErrors && (!row.token || Boolean(row.tokenError));

  return (
    <div
      className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(160px,0.7fr)_minmax(180px,0.8fr)_minmax(120px,0.55fr)_28px] lg:items-center"
    >
      <label className="flex min-w-0 flex-col gap-1 lg:block">
        <span className="font-montserrat text-sm text-[#606060] lg:hidden">Recipient</span>
        <span
          className={cn(
            "flex h-9 items-center gap-2 rounded-[6px] border bg-[#f6f6f6] px-3",
            showAddressStatus && !addressOk ? "border-danger" : "border-[#e3e3e3]",
          )}
        >
          <input
            value={row.address}
            onChange={(event) => onPatch({ address: event.target.value })}
            placeholder="Wallet address"
            className={cn(
              "min-w-0 flex-1 bg-transparent font-montserrat text-sm font-medium outline-none placeholder:text-black/30",
              showAddressStatus && !addressOk ? "text-danger" : "text-black",
            )}
          />
          {showAddressStatus ? <BatchFieldStatus ok={addressOk} /> : null}
        </span>
      </label>

      <label className="flex min-w-0 flex-col gap-1 lg:block">
        <span className="font-montserrat text-sm text-[#606060] lg:hidden">Amount</span>
        <span
          className={cn(
            "flex h-9 items-center gap-2 rounded-[6px] border bg-[#f6f6f6] px-3",
            showAmountStatus && !amountOk ? "border-danger" : "border-[#e3e3e3]",
          )}
        >
          <InputNumber
            value={row.amount}
            decimals={AMOUNT_MAX_DECIMALS}
            onNumberChange={(value) => onPatch({ amount: value })}
            placeholder={showErrors && !row.amount.trim() ? "Input amount" : "0"}
            className={cn(
              "min-w-0 flex-1 bg-transparent text-left font-montserrat text-sm font-medium outline-none placeholder:text-black/30",
              showAmountStatus && !amountOk ? "text-danger placeholder:text-danger" : "text-black",
            )}
          />
          {/* <IconSwap className="size-2.5 shrink-0 text-[#909090]" /> */}
        </span>
      </label>

      <label className="flex min-w-0 flex-col gap-1 lg:block">
        <span className="font-montserrat text-sm text-[#606060] lg:hidden">Prefer Token, Network</span>
        <BatchTokenTrigger
          token={row.token}
          showLogo
          invalid={tokenInvalid}
          onClick={onOpenDestToken}
        />
      </label>

      <label className="flex min-w-0 flex-col gap-1 lg:block">
        <span className="font-montserrat text-sm text-[#606060] lg:hidden">Memo</span>
        <input
          value={row.memo}
          maxLength={MEMO_MAX_LENGTH}
          onChange={(event) => onPatch({ memo: event.target.value })}
          placeholder="Optional"
          className="h-9 w-full rounded-[6px] border border-[#e3e3e3] bg-[#f6f6f6] px-3 font-montserrat text-sm text-black outline-none placeholder:text-black/30"
        />
      </label>

      <button
        type="button"
        aria-label="Remove row"
        disabled={!canRemove}
        onClick={onRemove}
        className="inline-flex size-7 items-center justify-center self-end text-[#909090] disabled:opacity-30 lg:self-center"
      >
        <IconDelete className="size-3.5" />
      </button>
    </div>
  );
}

export function formatBatchTotal(total: string): string {
  return formatAmount(total, { prefix: "", maxDecimals: 2 });
}
