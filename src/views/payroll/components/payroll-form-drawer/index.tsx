import { useEffect, useState } from "react";
import { IconDelete } from "@stableflow/pay-ui/icons/delete";
import { IconExportLink } from "@stableflow/pay-ui/icons/link";
import { IconPlus } from "@stableflow/pay-ui/icons/plus";
import { TokenSelectDialog } from "@stableflow/pay-widgets/token-select";
import { Button } from "@stableflow/pay-ui/button";
import { BUTTON_SIZE, BUTTON_VARIANT } from "@stableflow/pay-ui/button";
import { Dialog } from "@stableflow/pay-ui/dialog";
import { Drawer } from "@stableflow/pay-ui/drawer";
import { DRAWER_SIDE } from "@stableflow/pay-ui/drawer";
import { Dropdown } from "@stableflow/pay-ui/dropdown";
import { InputNumber } from "@stableflow/pay-ui/input-number";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import {
  PAYROLL_IMPORT_DAY_TYPE,
  type PayrollImportDayType
} from "@/types/payroll";
import { intentsTokenForSelection, useIntentsTokensStore } from "@/stores/intents-tokens";
import { amountError } from "@/views/pay/batch-utils";
import { BatchTokenTrigger } from "@/views/pay/components/batch/BatchTokenTrigger";
import { DrawerFormField, DrawerFormFooter } from "@/views/pay/components/drawer-form-field";
import { firstDrawerFormError } from "@/views/pay/form-drawer-utils";
import type { PayrollNextRun, PayrollRecipientRow } from "@/mocks/payroll";
import {
  PAYROLL_DRAWER_MODE,
  PAYROLL_DRAWER_TITLE,
  PAYROLL_FORM_AMOUNT_MAX_DECIMALS,
  PAYROLL_FORM_COLUMNS,
  PAYROLL_FORM_MAX_ROWS,
  PAYROLL_HISTORY_DETAIL_DESKTOP_QUERY,
  PAYROLL_PAY_DATE_TYPE_OPTIONS,
  PAYROLL_PAY_DAY_NUMBERS,
  type PayrollDrawerMode
} from "../../config";
import {
  createEmptyPayrollFormRow,
  defaultPayrollPayDay,
  exportPayrollNextCsv,
  formRowFromRecipient,
  formRowsToNextRun,
  isPayrollFormValid,
  normalizePayrollPayDay,
  patchPayrollFormRow,
  payrollEmailError,
  payrollPayDayToParam,
  payrollPayDayToType,
  payrollTypeToPayDay,
  refillPayrollFormTokens,
  type PayrollFormRow
} from "../../utils";

export function PayrollFormDrawer(props: {
  open: boolean;
  mode: PayrollDrawerMode;
  initialPayDay?: number;
  initialRows?: PayrollRecipientRow[];
  onClose: () => void;
  onSave: (run: PayrollNextRun) => void | Promise<void>;
  saving?: boolean;
}) {
  const {
    open,
    mode,
    initialPayDay,
    initialRows,
    onClose,
    onSave,
    saving = false
  } = props;
  const tokens = useIntentsTokensStore((state) => state.tokens);
  const findByChainAndSymbol = useIntentsTokensStore(
    (state) => state.findByChainAndSymbol
  );
  const initialDay = normalizePayrollPayDay(
    initialPayDay ?? defaultPayrollPayDay()
  );
  const [payDateType, setPayDateType] = useState<PayrollImportDayType>(() =>
    payrollPayDayToType(initialDay)
  );
  const [payDay, setPayDay] = useState<number | null>(() =>
    payrollPayDayToType(initialDay) === PAYROLL_IMPORT_DAY_TYPE.DayOfMonth
      ? initialDay
      : null
  );
  const [dayPickerOpen, setDayPickerOpen] = useState(false);
  const [rows, setRows] = useState<PayrollFormRow[]>(() => [
    createEmptyPayrollFormRow()
  ]);
  const [destRowId, setDestRowId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setDestRowId(null);
      setDayPickerOpen(false);
      return;
    }
    const nextDay = normalizePayrollPayDay(
      initialPayDay ?? defaultPayrollPayDay()
    );
    const nextType = payrollPayDayToType(nextDay);
    setPayDateType(nextType);
    setPayDay(nextType === PAYROLL_IMPORT_DAY_TYPE.DayOfMonth ? nextDay : null);
    setRows(
      initialRows && initialRows.length > 0
        ? initialRows.map((row) =>
            formRowFromRecipient(row, findByChainAndSymbol)
          )
        : [createEmptyPayrollFormRow()]
    );
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setRows((current) =>
      refillPayrollFormTokens(current, findByChainAndSymbol)
    );
  }, [open, tokens, findByChainAndSymbol]);

  const destRow = rows.find((row) => row.id === destRowId) ?? null;
  const canSave = isPayrollFormValid(rows);
  const firstError = firstDrawerFormError({ rows });
  const isDesktop = useMediaQuery(PAYROLL_HISTORY_DETAIL_DESKTOP_QUERY);
  const savedRows = initialRows ?? [];
  const canExport =
    mode === PAYROLL_DRAWER_MODE.Edit && savedRows.length > 0;

  function handlePayDateTypeChange(value: string) {
    if (
      value === PAYROLL_IMPORT_DAY_TYPE.FirstDay ||
      value === PAYROLL_IMPORT_DAY_TYPE.LastDay
    ) {
      setPayDateType(value);
      setPayDay(null);
      return;
    }
    if (value === PAYROLL_IMPORT_DAY_TYPE.DayOfMonth) {
      setDayPickerOpen(true);
    }
  }

  function handlePickPayDay(day: number) {
    const schedule = payrollPayDayToParam(day);
    setPayDateType(schedule.payrollDayType);
    setPayDay(schedule.payrollDay ?? null);
    setDayPickerOpen(false);
  }

  function patchRow(
    rowId: string,
    patch: Parameters<typeof patchPayrollFormRow>[1]
  ) {
    setRows((current) =>
      current.map((row) =>
        row.id === rowId
          ? patchPayrollFormRow(row, patch, findByChainAndSymbol)
          : row
      )
    );
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side={isDesktop ? DRAWER_SIDE.Right : DRAWER_SIDE.Bottom}
      title={PAYROLL_DRAWER_TITLE[mode]}
      titleClassName="min-w-0 flex-1"
      headerAction={
        canExport ? (
          <Button
            variant={BUTTON_VARIANT.Normal}
            size={BUTTON_SIZE.Sm}
            className="h-8 rounded-[10px] border-black/10 bg-white px-3 text-xs capitalize text-black"
            onClick={() => {
              exportPayrollNextCsv(savedRows);
            }}
          >
            <IconExportLink className="size-3.5 shrink-0" />
            Export CSV
          </Button>
        ) : null
      }
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
            style={{ gridTemplateColumns: PAYROLL_FORM_COLUMNS }}
          >
            <p className="whitespace-nowrap font-montserrat text-sm font-medium text-[#606060]">
              Set Pay Date
            </p>
            <Dropdown
              className="col-span-5 w-full min-w-0"
              value={payDateType}
              onChange={handlePayDateTypeChange}
              options={PAYROLL_PAY_DATE_TYPE_OPTIONS.map((option) => ({
                value: option.value,
                label:
                  option.value === PAYROLL_IMPORT_DAY_TYPE.DayOfMonth &&
                  payDateType === PAYROLL_IMPORT_DAY_TYPE.DayOfMonth &&
                  payDay != null
                    ? `${option.label} (${payDay})`
                    : option.label
              }))}
            />
          </div>

          <div className="mt-[30px] border-t border-black/10 pt-5">
            <div
              className="grid gap-2.5 font-montserrat text-sm font-medium text-[#aaa]"
              style={{ gridTemplateColumns: PAYROLL_FORM_COLUMNS }}
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
                <PayrollFormRowFields
                  key={row.id}
                  row={row}
                  canRemove={rows.length > 1}
                  onPatch={(patch) => patchRow(row.id, patch)}
                  onOpenToken={() => setDestRowId(row.id)}
                  onRemove={() => {
                    setRows((current) =>
                      current.filter((item) => item.id !== row.id)
                    );
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              disabled={rows.length >= PAYROLL_FORM_MAX_ROWS}
              onClick={() => {
                setRows((current) =>
                  current.length >= PAYROLL_FORM_MAX_ROWS
                    ? current
                    : [...current, createEmptyPayrollFormRow()]
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
              void onSave(
                formRowsToNextRun(
                  rows,
                  payrollTypeToPayDay(payDateType, payDay)
                )
              );
            }}
          >
            Save
          </Button>
        </DrawerFormFooter>
      </div>

      <PayrollPayDayPickerDialog
        open={dayPickerOpen}
        selectedDay={
          payDay ??
          (payDateType === PAYROLL_IMPORT_DAY_TYPE.FirstDay
            ? 1
            : payDateType === PAYROLL_IMPORT_DAY_TYPE.LastDay
              ? 31
              : null)
        }
        onClose={() => setDayPickerOpen(false)}
        onSelect={handlePickPayDay}
      />
      <TokenSelectDialog
        open={Boolean(destRow)}
        onClose={() => setDestRowId(null)}
        title="Prefer token"
        selectedAssetId={destRow?.token?.assetId}
        lockChainKind={destRow?.chainKind}
        role="receiver"
        onSelect={({ token }) => {
          if (!destRowId) return;
          const next = intentsTokenForSelection(token);
          if (!next) return;
          patchRow(destRowId, { token: next });
          setDestRowId(null);
        }}
      />
    </Drawer>
  );
}

function PayrollPayDayPickerDialog(props: {
  open: boolean;
  selectedDay: number | null;
  onClose: () => void;
  onSelect: (day: number) => void;
}) {
  const { open, selectedDay, onClose, onSelect } = props;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Day of month"
      cardClassName="w-full md:w-[360px]"
    >
      <div className="grid grid-cols-7 gap-2">
        {PAYROLL_PAY_DAY_NUMBERS.map((day) => {
          const active = selectedDay === day;
          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelect(day)}
              className={cn(
                "h-9 rounded-[10px] font-montserrat text-sm font-medium transition-colors",
                active ? "bg-black text-white" : "text-black hover:bg-black/5"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </Dialog>
  );
}

function PayrollFormRowFields(props: {
  row: PayrollFormRow;
  canRemove: boolean;
  onPatch: (patch: Parameters<typeof patchPayrollFormRow>[1]) => void;
  onOpenToken: () => void;
  onRemove: () => void;
}) {
  const { row, canRemove, onPatch, onOpenToken, onRemove } = props;
  const addressInvalid = Boolean(row.address.trim()) && Boolean(row.addressError);
  const emailInvalid = Boolean(payrollEmailError(row.email));
  const amountInvalid = Boolean(row.amount.trim()) && Boolean(amountError(row.amount));

  return (
    <div
      className="grid items-center gap-2.5"
      style={{ gridTemplateColumns: PAYROLL_FORM_COLUMNS }}
    >
      <input
        value={row.name}
        onChange={(event) => onPatch({ name: event.target.value })}
        placeholder="Name"
        className="h-9 min-w-0 rounded-[6px] border border-[#e3e3e3] bg-[#f6f6f6] px-2.5 font-montserrat text-sm font-medium text-black outline-none placeholder:text-black/30"
      />
      <DrawerFormField invalid={addressInvalid} className="bg-[#f6f6f6]">
        <input
          value={row.address}
          onChange={(event) => onPatch({ address: event.target.value })}
          placeholder="Wallet address"
          className="min-w-0 flex-1 bg-transparent font-montserrat text-sm font-medium outline-none placeholder:text-black/30"
        />
      </DrawerFormField>
      <DrawerFormField invalid={emailInvalid} className="bg-[#f6f6f6]">
        <input
          type="email"
          value={row.email}
          onChange={(event) => onPatch({ email: event.target.value })}
          placeholder="Email"
          className="min-w-0 flex-1 bg-transparent font-montserrat text-sm font-medium outline-none placeholder:text-black/30"
        />
      </DrawerFormField>
      <BatchTokenTrigger token={row.token} showLogo onClick={onOpenToken} />
      <DrawerFormField invalid={amountInvalid} className="bg-[#f6f6f6]">
        <InputNumber
          value={row.amount}
          decimals={PAYROLL_FORM_AMOUNT_MAX_DECIMALS}
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
