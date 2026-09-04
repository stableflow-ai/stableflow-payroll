import type { IntentsToken } from "@/stores/intents-tokens";
import { normalizeSymbol } from "@/stores/intents-tokens";
import type { WalletChainKind } from "@/utils";
import { Big } from "@/utils";
import {
  amountError,
  detectAddressKind,
  resolveImportToken,
  type FindTokenByChainAndSymbol,
} from "@/views/pay/batch-utils";
import type { PayrollNextRun, PayrollRecipientRow } from "@/mocks/payroll";
import {
  PAYROLL_PAY_DATE,
  PAYROLL_PAY_DATE_OPTIONS,
  type PayrollPayDate,
} from "./config";

export type PayrollFormRow = {
  id: string;
  name: string;
  address: string;
  chainKind: WalletChainKind | null;
  addressError: string | null;
  amount: string;
  token: IntentsToken | null;
  rawToken: string;
  rawNetwork: string;
};

export type PayrollFormRowPatch = Partial<
  Pick<PayrollFormRow, "name" | "address" | "amount" | "token">
>;

export function defaultPayrollPayDate(): PayrollPayDate {
  return PAYROLL_PAY_DATE.NextMonth1st;
}

export function payDateLabel(value: PayrollPayDate): string {
  return (
    PAYROLL_PAY_DATE_OPTIONS.find((option) => option.value === value)?.label ??
    PAYROLL_PAY_DATE_OPTIONS[0].label
  );
}

export function payDateFromLabel(label: string | undefined): PayrollPayDate {
  const match = PAYROLL_PAY_DATE_OPTIONS.find((option) => option.label === label);
  return match?.value ?? defaultPayrollPayDate();
}

export function createEmptyPayrollFormRow(): PayrollFormRow {
  const detected = detectAddressKind("");
  return {
    id: crypto.randomUUID(),
    name: "",
    address: "",
    chainKind: detected.chainKind,
    addressError: detected.error,
    amount: "",
    token: null,
    rawToken: "",
    rawNetwork: "",
  };
}

export function formRowFromRecipient(
  row: PayrollRecipientRow,
  findByChainAndSymbol: FindTokenByChainAndSymbol,
): PayrollFormRow {
  const detected = detectAddressKind(row.address);
  const resolved = resolveImportToken(
    row.token,
    row.network,
    detected.chainKind,
    findByChainAndSymbol,
  );
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    chainKind: detected.chainKind,
    addressError: detected.error,
    amount: row.amount,
    token: resolved.token,
    rawToken: row.token,
    rawNetwork: row.network,
  };
}

export function patchPayrollFormRow(
  row: PayrollFormRow,
  patch: PayrollFormRowPatch,
  findByChainAndSymbol: FindTokenByChainAndSymbol,
): PayrollFormRow {
  const next: PayrollFormRow = { ...row, ...patch };

  if (patch.address !== undefined) {
    const detected = detectAddressKind(next.address);
    next.chainKind = detected.chainKind;
    next.addressError = detected.error;
    if (next.token && next.chainKind && next.token.chain.chainKind !== next.chainKind) {
      next.token = null;
      next.rawToken = "";
      next.rawNetwork = "";
    }
  }

  if (patch.token !== undefined) {
    next.rawToken = patch.token?.symbol ?? "";
    next.rawNetwork = patch.token?.blockchain ?? "";
    if (next.token && next.chainKind && next.token.chain.chainKind !== next.chainKind) {
      next.token = null;
      next.rawToken = "";
      next.rawNetwork = "";
    }
  }

  if (!next.token && (next.rawToken || next.rawNetwork)) {
    const resolved = resolveImportToken(
      next.rawToken,
      next.rawNetwork,
      next.chainKind,
      findByChainAndSymbol,
    );
    next.token = resolved.token;
  }

  return next;
}

export function refillPayrollFormTokens(
  rows: PayrollFormRow[],
  findByChainAndSymbol: FindTokenByChainAndSymbol,
): PayrollFormRow[] {
  return rows.map((row) => {
    if (row.token || (!row.rawToken && !row.rawNetwork)) return row;
    const resolved = resolveImportToken(
      row.rawToken,
      row.rawNetwork,
      row.chainKind,
      findByChainAndSymbol,
    );
    return { ...row, token: resolved.token };
  });
}

export function isPayrollFormRowValid(row: PayrollFormRow): boolean {
  return (
    Boolean(row.name.trim()) &&
    !row.addressError &&
    Boolean(row.chainKind) &&
    Boolean(row.token) &&
    !amountError(row.amount)
  );
}

export function isPayrollFormValid(rows: PayrollFormRow[]): boolean {
  return rows.length > 0 && rows.every(isPayrollFormRowValid);
}

export function sumPayrollFormAmounts(rows: PayrollFormRow[]): string {
  return rows.reduce((sum, row) => {
    const trimmed = row.amount.trim();
    if (!trimmed || amountError(trimmed)) return sum;
    try {
      return new Big(sum).plus(trimmed).toFixed();
    } catch {
      return sum;
    }
  }, "0");
}

export function formRowsToNextRun(
  rows: PayrollFormRow[],
  payDate: PayrollPayDate,
): PayrollNextRun {
  const mapped: PayrollRecipientRow[] = rows.map((row) => {
    const symbol = row.token?.symbol ?? normalizeSymbol(row.rawToken) ?? row.rawToken;
    const network = row.token?.blockchain ?? row.rawNetwork;
    return {
      id: row.id,
      name: row.name.trim(),
      address: row.address.trim(),
      token: symbol,
      network,
      amount: row.amount.trim(),
      netPay: row.amount.trim(),
    };
  });
  return {
    totalPayout: sumPayrollFormAmounts(rows),
    recipients: mapped.length,
    payDate: payDateLabel(payDate),
    rows: mapped,
  };
}
