import { useEffect, useState } from "react";
import { IconDelete } from "@/components/icons/delete";
import { IconPlus } from "@/components/icons/plus";
import { TokenSelectDialog } from "@/components/token-select-dialog/TokenSelectDialog";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_VARIANT } from "@/components/ui/button/config";
import { Drawer } from "@/components/ui/drawer/Drawer";
import { DRAWER_SIDE } from "@/components/ui/drawer/config";
import { InputNumber } from "@/components/ui/input-number/InputNumber";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { useIntentsTokensStore } from "@/stores/intents-tokens";
import { BONUS_IMPORT_LIMITS, type BonusImportItem, type BonusPendingRow } from "@/types/bonus";
import { amountError } from "@/views/pay/batch-utils";
import { BatchTokenTrigger } from "@/views/pay/components/batch/BatchTokenTrigger";
import { DrawerFormField, DrawerFormFooter } from "@/views/pay/components/drawer-form-field";
import { firstDrawerFormError } from "@/views/pay/form-drawer-utils";
import {
  BONUS_DRAWER_TITLE,
  BONUS_FORM_AMOUNT_MAX_DECIMALS,
  BONUS_FORM_COLUMNS,
  BONUS_FORM_DESKTOP_QUERY,
  BONUS_FORM_MAX_ROWS,
  BONUS_FORM_TITLE_MAX,
  type BonusDrawerMode,
} from "../../config";
import {
  bonusEmailError,
  createEmptyBonusFormRow,
  formRowFromPending,
  formRowsToImportPayload,
  isBonusFormValid,
  patchBonusFormRow,
  refillBonusFormTokens,
  type BonusFormRow,
} from "../../utils";

export function BonusFormDrawer(props: {
  open: boolean;
  mode: BonusDrawerMode;
  initialRows?: BonusPendingRow[];
  saving?: boolean;
  onClose: () => void;
  onSave: (payload: { title: string; items: BonusImportItem[] }) => void | Promise<void>;
}) {
  const { open, mode, initialRows, saving = false, onClose, onSave } = props;
  const tokens = useIntentsTokensStore((state) => state.tokens);
  const findByChainAndSymbol = useIntentsTokensStore((state) => state.findByChainAndSymbol);
  const [title, setTitle] = useState("");
  const [rows, setRows] = useState<BonusFormRow[]>(() => [createEmptyBonusFormRow()]);
  const [destRowId, setDestRowId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setDestRowId(null);
      return;
    }
    setTitle("");
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
  const canSave = isBonusFormValid(rows, title);
  const titleInvalid = !title.trim();
  const firstError = firstDrawerFormError({ titleLabel: "Bonus Title", title, rows });
  const isDesktop = useMediaQuery(BONUS_FORM_DESKTOP_QUERY);

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
      side={isDesktop ? DRAWER_SIDE.Right : DRAWER_SIDE.Bottom}
      title={BONUS_DRAWER_TITLE[mode]}
      panelClassName={isDesktop ? "w-[min(100%,1080px)]" : undefined}
      cardClassName={cn(
        "p-6 sm:px-8 sm:pt-8 sm:pb-0",
        isDesktop ? "h-full rounded-r-none" : "w-full max-h-[90vh] rounded-b-none",
      )}
    >
      <div className="flex min-h-0 flex-col">
        <div className="min-w-0 w-full flex-1 overflow-x-auto pb-6">
          <div className="min-w-[900px]">
          <div
            className="grid items-center gap-2.5"
            style={{ gridTemplateColumns: BONUS_FORM_COLUMNS }}
          >
            <p className="whitespace-nowrap font-montserrat text-sm font-medium text-[#606060]">
              Bonus Title
            </p>
            <DrawerFormField invalid={titleInvalid} className="col-span-5 w-full bg-white">
              <input
                value={title}
                maxLength={BONUS_FORM_TITLE_MAX}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Title"
                className="min-w-0 flex-1 bg-transparent font-montserrat text-sm font-medium outline-none placeholder:text-black/30"
              />
            </DrawerFormField>
          </div>

          <div className="mt-[30px] border-t border-black/10 pt-5">
            <div
              className="grid gap-2.5 font-montserrat text-sm font-medium text-[#aaa]"
              style={{ gridTemplateColumns: BONUS_FORM_COLUMNS }}
            >
              <span>Name</span>
              <span>Address</span>
              <span>Email</span>
              <span>Payout Preference</span>
              <span>Amount</span>
              <span />
            </div>
            <div className="mt-4 flex flex-col gap-5">
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
              disabled={rows.length >= BONUS_FORM_MAX_ROWS || saving}
              onClick={() => {
                setRows((current) =>
                  current.length >= BONUS_FORM_MAX_ROWS
                    ? current
                    : [...current, createEmptyBonusFormRow()],
                );
              }}
              className="mt-6 flex h-9 w-full items-center justify-center gap-2 rounded-[8px] border border-dashed border-black/20 font-montserrat text-sm font-medium text-black disabled:opacity-40"
            >
              <IconPlus className="size-3 shrink-0" />
              Add one
            </button>
          </div>
          </div>
        </div>

        <DrawerFormFooter error={canSave ? null : firstError}>
          <Button
            variant={BUTTON_VARIANT.Normal}
            className="h-10 w-[152px] rounded-[10px] border-[#e3e3e3] text-base text-[#606060]"
            disabled={saving}
            onClick={onClose}
          >
            Back
          </Button>
          <Button
            className="h-10 w-[160px] rounded-[10px] text-base"
            disabled={!canSave || saving}
            onClick={() => {
              if (!canSave || saving) return;
              void onSave(formRowsToImportPayload(rows, title));
            }}
          >
            Save
          </Button>
        </DrawerFormFooter>
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
  const emailInvalid = Boolean(bonusEmailError(row.email));
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
        maxLength={BONUS_IMPORT_LIMITS.name}
        className="h-9 min-w-0 rounded-[6px] border border-[#e3e3e3] bg-[#f6f6f6] px-2.5 font-montserrat text-sm font-medium text-black outline-none placeholder:text-black/30"
      />
      <DrawerFormField invalid={addressInvalid} className="bg-[#f6f6f6]">
        <input
          value={row.address}
          onChange={(event) => onPatch({ address: event.target.value })}
          placeholder="Wallet address"
          maxLength={BONUS_IMPORT_LIMITS.address}
          className="min-w-0 flex-1 bg-transparent font-montserrat text-sm font-medium outline-none placeholder:text-black/30"
        />
      </DrawerFormField>
      <DrawerFormField invalid={emailInvalid} className="bg-[#f6f6f6]">
        <input
          type="email"
          value={row.email}
          onChange={(event) => onPatch({ email: event.target.value })}
          placeholder="Email"
          maxLength={BONUS_IMPORT_LIMITS.email}
          className="min-w-0 flex-1 bg-transparent font-montserrat text-sm font-medium outline-none placeholder:text-black/30"
        />
      </DrawerFormField>
      <BatchTokenTrigger token={row.token} showLogo onClick={onOpenToken} />
      <DrawerFormField invalid={amountInvalid} className="bg-[#f6f6f6]">
        <InputNumber
          value={row.amount}
          decimals={BONUS_FORM_AMOUNT_MAX_DECIMALS}
          onNumberChange={(value) => onPatch({ amount: value })}
          placeholder="0"
          className="min-w-0 w-full bg-transparent font-montserrat text-sm font-medium outline-none placeholder:text-black/30"
        />
      </DrawerFormField>
      <button
        type="button"
        aria-label="Remove row"
        disabled={!canRemove}
        onClick={onRemove}
        className="inline-flex size-3.5 items-center justify-center justify-self-start text-black disabled:opacity-30"
      >
        <IconDelete className="size-3.5" />
      </button>
    </div>
  );
}
