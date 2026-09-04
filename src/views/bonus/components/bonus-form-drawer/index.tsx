import { useEffect, useState } from "react";
import { IconAlertCircle } from "@/components/icons/alert";
import { IconDelete } from "@/components/icons/delete";
import { IconPlus } from "@/components/icons/plus";
import { TokenSelectDialog } from "@/components/token-select-dialog/TokenSelectDialog";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_VARIANT } from "@/components/ui/button/config";
import { Drawer } from "@/components/ui/drawer/Drawer";
import { DRAWER_SIDE } from "@/components/ui/drawer/config";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { InputNumber } from "@/components/ui/input-number/InputNumber";
import { cn } from "@/lib/utils";
import { useIntentsTokensStore } from "@/stores/intents-tokens";
import { amountError } from "@/views/pay/batch-utils";
import { BatchTokenTrigger } from "@/views/pay/components/batch/BatchTokenTrigger";
import type { BonusPendingList, BonusPendingRow } from "@/mocks/bonus";
import {
  BONUS_DRAWER_TITLE,
  BONUS_FORM_AMOUNT_MAX_DECIMALS,
  BONUS_FORM_COLUMNS,
  BONUS_FORM_MAX_ROWS,
  BONUS_PAY_DATE_OPTIONS,
  type BonusDrawerMode,
  type BonusPayDate,
} from "../../config";
import {
  createEmptyBonusFormRow,
  formRowFromPending,
  formRowsToPendingList,
  isBonusFormValid,
  patchBonusFormRow,
  payDateFromLabel,
  refillBonusFormTokens,
  type BonusFormRow,
} from "../../utils";

export function BonusFormDrawer(props: {
  open: boolean;
  mode: BonusDrawerMode;
  initialPayDate?: string;
  initialRows?: BonusPendingRow[];
  onClose: () => void;
  onSave: (list: BonusPendingList) => void;
}) {
  const { open, mode, initialPayDate, initialRows, onClose, onSave } = props;
  const tokens = useIntentsTokensStore((state) => state.tokens);
  const findByChainAndSymbol = useIntentsTokensStore((state) => state.findByChainAndSymbol);
  const [payDate, setPayDate] = useState<BonusPayDate>(() => payDateFromLabel(initialPayDate));
  const [rows, setRows] = useState<BonusFormRow[]>(() => [createEmptyBonusFormRow()]);
  const [destRowId, setDestRowId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setDestRowId(null);
      return;
    }
    setPayDate(payDateFromLabel(initialPayDate));
    setRows(
      initialRows && initialRows.length > 0
        ? initialRows.map((row) => formRowFromPending(row, findByChainAndSymbol))
        : [createEmptyBonusFormRow()],
    );
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setRows((current) => refillBonusFormTokens(current, findByChainAndSymbol));
  }, [open, tokens, findByChainAndSymbol]);

  const destRow = rows.find((row) => row.id === destRowId) ?? null;
  const canSave = isBonusFormValid(rows);

  function patchRow(rowId: string, patch: Parameters<typeof patchBonusFormRow>[1]) {
    setRows((current) =>
      current.map((row) =>
        row.id === rowId ? patchBonusFormRow(row, patch, findByChainAndSymbol) : row,
      ),
    );
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side={DRAWER_SIDE.Right}
      title={BONUS_DRAWER_TITLE[mode]}
      cardClassName="h-full w-[min(100%,941px)] rounded-r-none p-6 sm:px-8 sm:pt-8 sm:pb-0"
    >
      <div className="flex min-h-full flex-col">
        <div className="min-w-[760px] flex-1 overflow-x-auto pb-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <p className="shrink-0 font-montserrat text-sm font-medium text-[#606060]">
                Set Pay Date
              </p>
              <Dropdown
                className="w-full min-w-0 flex-1"
                value={payDate}
                onChange={(value) => setPayDate(value as BonusPayDate)}
                options={[...BONUS_PAY_DATE_OPTIONS]}
              />
            </div>

            <div>
              <div
                className="grid gap-2.5 font-montserrat text-sm font-medium text-[#aaa]"
                style={{ gridTemplateColumns: BONUS_FORM_COLUMNS }}
              >
                <span>Name</span>
                <span>Address</span>
                <span>Payout Preference</span>
                <span>Amount</span>
                <span />
              </div>
              <div className="mt-3.5 flex flex-col gap-5">
                {rows.map((row) => (
                  <BonusFormRowFields
                    key={row.id}
                    row={row}
                    canRemove={rows.length > 1}
                    onPatch={(patch) => patchRow(row.id, patch)}
                    onOpenToken={() => setDestRowId(row.id)}
                    onRemove={() => {
                      setRows((current) => current.filter((item) => item.id !== row.id));
                    }}
                  />
                ))}
              </div>
              <button
                type="button"
                disabled={rows.length >= BONUS_FORM_MAX_ROWS}
                onClick={() => {
                  setRows((current) =>
                    current.length >= BONUS_FORM_MAX_ROWS
                      ? current
                      : [...current, createEmptyBonusFormRow()],
                  );
                }}
                className="mt-5 flex h-9 w-full items-center justify-center gap-2 rounded-[8px] border border-dashed border-black/20 font-montserrat text-sm font-medium text-black disabled:opacity-40"
              >
                <IconPlus className="size-3 shrink-0" />
                Add one
              </button>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 -mx-6 flex justify-end gap-4 border-t border-black/10 bg-[#FDFDFD] px-6 py-5 sm:-mx-8 sm:px-8">
          <Button
            variant={BUTTON_VARIANT.Normal}
            className="h-10 w-[152px] rounded-[10px] border-[#e3e3e3] text-base text-[#606060]"
            onClick={onClose}
          >
            Back
          </Button>
          <Button
            className="h-10 w-[160px] rounded-[10px] text-base"
            disabled={!canSave}
            onClick={() => {
              // TODO(api): persist the bonus draft when the contract exists.
              onSave(formRowsToPendingList(rows, payDate));
            }}
          >
            Save
          </Button>
        </div>
      </div>

      <TokenSelectDialog
        open={Boolean(destRow)}
        onClose={() => setDestRowId(null)}
        title="Prefer token"
        selectedAssetId={destRow?.token?.assetId}
        lockChainKind={destRow?.chainKind}
        onSelect={({ token }) => {
          if (!destRowId) return;
          patchRow(destRowId, { token });
          setDestRowId(null);
        }}
      />
    </Drawer>
  );
}

function BonusFormRowFields(props: {
  row: BonusFormRow;
  canRemove: boolean;
  onPatch: (patch: Parameters<typeof patchBonusFormRow>[1]) => void;
  onOpenToken: () => void;
  onRemove: () => void;
}) {
  const { row, canRemove, onPatch, onOpenToken, onRemove } = props;
  const addressInvalid = Boolean(row.address.trim()) && Boolean(row.addressError);
  const amountInvalid = Boolean(row.amount.trim()) && Boolean(amountError(row.amount));

  return (
    <div
      className="grid items-center gap-2.5"
      style={{ gridTemplateColumns: BONUS_FORM_COLUMNS }}
    >
      <input
        value={row.name}
        onChange={(event) => onPatch({ name: event.target.value })}
        placeholder="Name"
        className="h-9 min-w-0 rounded-[6px] border border-[#e3e3e3] bg-[#f6f6f6] px-2.5 font-montserrat text-sm font-medium text-black outline-none placeholder:text-black/30"
      />
      <span
        className={cn(
          "flex h-9 min-w-0 items-center gap-2 rounded-[6px] border bg-[#f6f6f6] px-3",
          addressInvalid ? "border-[#FF5656]" : "border-[#e3e3e3]",
        )}
      >
        <input
          value={row.address}
          onChange={(event) => onPatch({ address: event.target.value })}
          placeholder="Wallet address"
          className={cn(
            "min-w-0 flex-1 bg-transparent font-montserrat text-sm font-medium outline-none placeholder:text-black/30",
            addressInvalid ? "text-[#FF5656]" : "text-black",
          )}
        />
        {addressInvalid ? (
          <span className="size-3 shrink-0 overflow-clip text-[#FF5656]">
            <IconAlertCircle className="size-3" />
          </span>
        ) : null}
      </span>
      <BatchTokenTrigger token={row.token} showLogo onClick={onOpenToken} />
      <span
        className={cn(
          "flex h-9 items-center rounded-[6px] border bg-[#f6f6f6] px-3",
          amountInvalid ? "border-[#ff5656]" : "border-[#e3e3e3]",
        )}
      >
        <InputNumber
          value={row.amount}
          decimals={BONUS_FORM_AMOUNT_MAX_DECIMALS}
          onNumberChange={(value) => onPatch({ amount: value })}
          placeholder="0"
          className={cn(
            "min-w-0 w-full bg-transparent font-montserrat text-sm font-medium outline-none placeholder:text-black/30",
            amountInvalid ? "text-[#ff5656]" : "text-black",
          )}
        />
      </span>
      <button
        type="button"
        aria-label="Remove row"
        disabled={!canRemove}
        onClick={onRemove}
        className="inline-flex size-4 items-center justify-center text-black disabled:opacity-30"
      >
        <IconDelete className="size-3.5" />
      </button>
    </div>
  );
}
