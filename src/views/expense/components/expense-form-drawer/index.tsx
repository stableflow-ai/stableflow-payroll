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
import { EXPENSE_IMPORT_LIMITS, type ExpenseDraftRow, type ExpenseImportItem } from "@/types/expense";
import { amountError } from "@/views/pay/batch-utils";
import { BatchTokenTrigger } from "@/views/pay/components/batch/BatchTokenTrigger";
import { DrawerFormField, DrawerFormFooter } from "@/views/pay/components/drawer-form-field";
import { firstDrawerFormError } from "@/views/pay/form-drawer-utils";
import {
  EXPENSE_DRAWER_TITLE,
  EXPENSE_FORM_AMOUNT_MAX_DECIMALS,
  EXPENSE_FORM_COLUMNS,
  EXPENSE_FORM_DESKTOP_QUERY,
  EXPENSE_FORM_MAX_ROWS,
  EXPENSE_FORM_TITLE_MAX,
} from "../../config";
import {
  createEmptyExpenseFormRow,
  expenseEmailError,
  formRowFromDraft,
  formRowsToImportPayload,
  isExpenseFormValid,
  patchExpenseFormRow,
  refillExpenseFormTokens,
  type ExpenseFormRow,
} from "../../utils";

export function ExpenseFormDrawer(props: {
  open: boolean;
  initialRows?: ExpenseDraftRow[];
  saving?: boolean;
  title?: string;
  titleLabel?: string;
  onClose: () => void;
  onSave: (payload: { title: string; items: ExpenseImportItem[] }) => void | Promise<void>;
}) {
  const {
    open,
    initialRows,
    saving = false,
    title: drawerTitle = EXPENSE_DRAWER_TITLE,
    titleLabel = "Expense Title",
    onClose,
    onSave,
  } = props;
  const tokens = useIntentsTokensStore((state) => state.tokens);
  const findByChainAndSymbol = useIntentsTokensStore((state) => state.findByChainAndSymbol);
  const [title, setTitle] = useState("");
  const [rows, setRows] = useState<ExpenseFormRow[]>(() => [createEmptyExpenseFormRow()]);
  const [destRowId, setDestRowId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setDestRowId(null);
      return;
    }
    setTitle("");
    setRows(
      initialRows && initialRows.length > 0
        ? initialRows.map((row) => formRowFromDraft(row, findByChainAndSymbol))
        : [createEmptyExpenseFormRow()],
    );
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setRows((current) => refillExpenseFormTokens(current, findByChainAndSymbol));
  }, [open, tokens, findByChainAndSymbol]);

  const destRow = rows.find((row) => row.id === destRowId) ?? null;
  const canSave = Boolean(title.trim()) && isExpenseFormValid(rows);
  const titleInvalid = !title.trim();
  const firstError = firstDrawerFormError({ titleLabel, title, rows });
  const isDesktop = useMediaQuery(EXPENSE_FORM_DESKTOP_QUERY);

  function patchRow(rowId: string, patch: Parameters<typeof patchExpenseFormRow>[1]) {
    setRows((current) =>
      current.map((row) =>
        row.id === rowId ? patchExpenseFormRow(row, patch, findByChainAndSymbol) : row,
      ),
    );
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side={isDesktop ? DRAWER_SIDE.Right : DRAWER_SIDE.Bottom}
      title={drawerTitle}
      panelClassName={isDesktop ? "w-[min(100%,1200px)]" : undefined}
      cardClassName={cn(
        "p-6 sm:px-8 sm:pt-8 sm:pb-0",
        isDesktop ? "h-full rounded-r-none" : "w-full max-h-[90vh] rounded-b-none",
      )}
    >
      <div className="flex min-h-0 flex-col">
        <div className="min-w-0 w-full flex-1 overflow-x-auto pb-6">
          <div className="min-w-[980px]">
          <div
            className="grid items-center gap-2.5"
            style={{ gridTemplateColumns: EXPENSE_FORM_COLUMNS }}
          >
            <p className="whitespace-nowrap font-montserrat text-sm font-medium text-[#606060]">
              {titleLabel}
            </p>
            <DrawerFormField invalid={titleInvalid} className="col-span-7 w-full bg-white">
              <input
                value={title}
                maxLength={EXPENSE_FORM_TITLE_MAX}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Title"
                className="min-w-0 flex-1 bg-transparent font-montserrat text-sm font-medium outline-none placeholder:text-black/30"
              />
            </DrawerFormField>
          </div>

          <div className="mt-[30px] border-t border-black/10 pt-5">
            <div
              className="grid gap-2.5 font-montserrat text-sm font-medium text-[#aaa]"
              style={{ gridTemplateColumns: EXPENSE_FORM_COLUMNS }}
            >
              <span>Name</span>
              <span>Purpose</span>
              <span>Description</span>
              <span>Address</span>
              <span>Email</span>
              <span>Payout Preference</span>
              <span>Amount</span>
              <span />
            </div>
            <div className="mt-4 flex flex-col gap-5">
              {rows.map((row) => (
                <ExpenseFormRowFields
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
              disabled={rows.length >= EXPENSE_FORM_MAX_ROWS || saving}
              onClick={() => {
                setRows((current) =>
                  current.length >= EXPENSE_FORM_MAX_ROWS
                    ? current
                    : [...current, createEmptyExpenseFormRow()],
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

function ExpenseFormRowFields(props: {
  row: ExpenseFormRow;
  canRemove: boolean;
  onPatch: (patch: Parameters<typeof patchExpenseFormRow>[1]) => void;
  onOpenToken: () => void;
  onRemove: () => void;
}) {
  const { row, canRemove, onPatch, onOpenToken, onRemove } = props;
  const addressInvalid = Boolean(row.address.trim()) && Boolean(row.addressError);
  const emailInvalid = Boolean(expenseEmailError(row.email));
  const amountInvalid = Boolean(row.amount.trim()) && Boolean(amountError(row.amount));

  return (
    <div
      className="grid items-center gap-2.5"
      style={{ gridTemplateColumns: EXPENSE_FORM_COLUMNS }}
    >
      <input
        value={row.name}
        onChange={(event) => onPatch({ name: event.target.value })}
        placeholder="Name"
        maxLength={EXPENSE_IMPORT_LIMITS.name}
        className="h-9 min-w-0 rounded-[6px] border border-[#e3e3e3] bg-[#f6f6f6] px-2.5 font-montserrat text-sm font-medium text-black outline-none placeholder:text-black/30"
      />
      <input
        value={row.purpose}
        onChange={(event) => onPatch({ purpose: event.target.value })}
        placeholder="Purpose"
        maxLength={EXPENSE_IMPORT_LIMITS.purpose}
        className="h-9 min-w-0 rounded-[6px] border border-[#e3e3e3] bg-[#f6f6f6] px-2.5 font-montserrat text-sm font-medium text-black outline-none placeholder:text-black/30"
      />
      <input
        value={row.description}
        onChange={(event) => onPatch({ description: event.target.value })}
        placeholder="Description"
        maxLength={EXPENSE_IMPORT_LIMITS.description}
        className="h-9 min-w-0 rounded-[6px] border border-[#e3e3e3] bg-[#f6f6f6] px-2.5 font-montserrat text-sm font-medium text-black outline-none placeholder:text-black/30"
      />
      <DrawerFormField invalid={addressInvalid} className="bg-[#f6f6f6]">
        <input
          value={row.address}
          onChange={(event) => onPatch({ address: event.target.value })}
          placeholder="Wallet address"
          maxLength={EXPENSE_IMPORT_LIMITS.address}
          className="min-w-0 flex-1 bg-transparent font-montserrat text-sm font-medium outline-none placeholder:text-black/30"
        />
      </DrawerFormField>
      <DrawerFormField invalid={emailInvalid} className="bg-[#f6f6f6]">
        <input
          type="email"
          value={row.email}
          onChange={(event) => onPatch({ email: event.target.value })}
          placeholder="Email"
          maxLength={EXPENSE_IMPORT_LIMITS.email}
          className="min-w-0 flex-1 bg-transparent font-montserrat text-sm font-medium outline-none placeholder:text-black/30"
        />
      </DrawerFormField>
      <BatchTokenTrigger token={row.token} showLogo onClick={onOpenToken} />
      <DrawerFormField invalid={amountInvalid} className="bg-[#f6f6f6]">
        <InputNumber
          value={row.amount}
          decimals={EXPENSE_FORM_AMOUNT_MAX_DECIMALS}
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
