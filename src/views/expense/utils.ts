import { format, isValid } from "date-fns";
import type { IntentsToken } from "@/stores/intents-tokens";
import { normalizeSymbol } from "@/stores/intents-tokens";
import {
  EXPENSE_IMPORT_LIMITS,
  EXPENSE_TOTAL_PAYOUT_PERIOD,
  type ExpenseChartPoint,
  type ExpenseDraftRow,
  type ExpenseImportItem,
  type ExpenseTotalPayoutPeriod,
  type ExpenseTotalPayoutPoint,
} from "@/types/expense";
import { DATE_FORMAT, formatAddress, formatDate, type WalletChainKind } from "@/utils";
import {
  amountError,
  detectAddressKind,
  resolveImportToken,
  type FindTokenByChainAndSymbol,
} from "@/views/pay/batch-utils";
import { isValidEmail } from "@/views/pay/utils";
import { EXPENSE_FORM_MAX_ROWS } from "./config";

function chartPointValue(volume: string): number {
  const parsed = Number(volume);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function mapExpenseChartSeries(
  points: ExpenseTotalPayoutPoint[],
  period: ExpenseTotalPayoutPeriod = EXPENSE_TOTAL_PAYOUT_PERIOD.Month,
): {
  points: ExpenseChartPoint[];
  periodLabel: string;
  currentValue: string;
} {
  const axisFormat =
    period === EXPENSE_TOTAL_PAYOUT_PERIOD.Month ? DATE_FORMAT.Month : DATE_FORMAT.MonthDay;
  const mapped: ExpenseChartPoint[] = points.map((point) => ({
    label: formatDate(point.time, axisFormat) || point.time,
    value: chartPointValue(point.volume),
  }));

  let highlightIndex = -1;
  for (let index = mapped.length - 1; index >= 0; index -= 1) {
    if (mapped[index].value > 0) {
      highlightIndex = index;
      break;
    }
  }
  if (highlightIndex < 0 && mapped.length > 0) highlightIndex = mapped.length - 1;

  const chartPoints = mapped.map((point, index) =>
    index === highlightIndex ? { ...point, highlighted: true } : point,
  );
  const active = highlightIndex >= 0 ? points[highlightIndex] : null;
  const activeDate = active?.time ? new Date(active.time) : null;
  const periodLabel =
    activeDate && isValid(activeDate)
      ? format(
          activeDate,
          period === EXPENSE_TOTAL_PAYOUT_PERIOD.Month ? "MMMM, yyyy" : "MMMM d, yyyy",
        )
      : "";

  return {
    points: chartPoints,
    periodLabel,
    currentValue: active?.volume ?? "0",
  };
}

export type ExpenseFormRow = {
  id: string;
  name: string;
  purpose: string;
  description: string;
  address: string;
  email: string;
  chainKind: WalletChainKind | null;
  addressError: string | null;
  amount: string;
  token: IntentsToken | null;
  rawToken: string;
  rawNetwork: string;
};

export type ExpenseFormRowPatch = Partial<
  Pick<ExpenseFormRow, "name" | "purpose" | "description" | "address" | "email" | "amount" | "token">
>;

export function expenseEmailError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return isValidEmail(trimmed) ? null : "Enter a valid email";
}

export function createEmptyExpenseFormRow(): ExpenseFormRow {
  const detected = detectAddressKind("");
  return {
    id: crypto.randomUUID(),
    name: "",
    purpose: "",
    description: "",
    address: "",
    email: "",
    chainKind: detected.chainKind,
    addressError: detected.error,
    amount: "",
    token: null,
    rawToken: "",
    rawNetwork: "",
  };
}

export function formRowFromDraft(
  row: ExpenseDraftRow,
  findByChainAndSymbol: FindTokenByChainAndSymbol,
): ExpenseFormRow {
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
    purpose: row.purpose,
    description: row.description,
    address: row.address,
    email: row.email,
    chainKind: detected.chainKind,
    addressError: detected.error,
    amount: row.amount,
    token: resolved.token,
    rawToken: row.token,
    rawNetwork: row.network,
  };
}

export function patchExpenseFormRow(
  row: ExpenseFormRow,
  patch: ExpenseFormRowPatch,
  findByChainAndSymbol: FindTokenByChainAndSymbol,
): ExpenseFormRow {
  const next: ExpenseFormRow = { ...row, ...patch };

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

export function refillExpenseFormTokens(
  rows: ExpenseFormRow[],
  findByChainAndSymbol: FindTokenByChainAndSymbol,
): ExpenseFormRow[] {
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

export function isExpenseFormRowValid(row: ExpenseFormRow): boolean {
  return (
    Boolean(row.name.trim()) &&
    !row.addressError &&
    !expenseEmailError(row.email) &&
    Boolean(row.chainKind) &&
    Boolean(row.token) &&
    !amountError(row.amount)
  );
}

export function isExpenseFormValid(rows: ExpenseFormRow[]): boolean {
  return rows.length > 0 && rows.every(isExpenseFormRowValid);
}

export function fallbackExpenseImportName(name: string, email: string, address: string): string {
  const trimmedName = name.trim().slice(0, EXPENSE_IMPORT_LIMITS.name);
  if (trimmedName) return trimmedName;
  const local = email.trim().split("@")[0]?.trim() ?? "";
  if (local) return local.slice(0, EXPENSE_IMPORT_LIMITS.name);
  const shortened = formatAddress(address, 6, 4).trim();
  return (shortened || address.trim()).slice(0, EXPENSE_IMPORT_LIMITS.name);
}

type ExpenseImportField =
  | "name"
  | "address"
  | "email"
  | "amount"
  | "token"
  | "network"
  | "purpose"
  | "description";

const EXPENSE_IMPORT_HEADER_ALIASES: Record<ExpenseImportField, string[]> = {
  name: ["name", "recipientname", "employeename"],
  address: ["recipient", "address", "wallet", "to", "destination"],
  email: ["email", "mail", "e-mail"],
  amount: ["amount", "value"],
  token: ["token", "symbol", "asset"],
  network: ["network", "chain", "blockchain"],
  purpose: ["purpose", "reason"],
  description: ["description", "memo", "note", "comment", "remark", "receipt"],
};

const EXPENSE_IMPORT_POSITIONAL: Partial<Record<ExpenseImportField, number>> = {
  name: 0,
  address: 1,
  email: 2,
  amount: 3,
  token: 4,
  network: 5,
  purpose: 6,
  description: 7,
};

function normalizeImportHeader(cell: string): string {
  return cell.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function detectExpenseImportHeaderMap(
  row: string[],
): Partial<Record<ExpenseImportField, number>> | null {
  const map: Partial<Record<ExpenseImportField, number>> = {};
  row.forEach((cell, index) => {
    const normalized = normalizeImportHeader(cell);
    (Object.keys(EXPENSE_IMPORT_HEADER_ALIASES) as ExpenseImportField[]).forEach((field) => {
      if (map[field] != null) return;
      const match = EXPENSE_IMPORT_HEADER_ALIASES[field].some(
        (alias) => alias.replace(/[\s_-]+/g, "") === normalized,
      );
      if (match) map[field] = index;
    });
  });
  return Object.keys(map).length >= 2 ? map : null;
}

function importCellAt(row: string[], index: number | undefined): string {
  if (index == null) return "";
  return String(row[index] ?? "").trim();
}

function isEmptyExpenseImportRaw(raw: Record<ExpenseImportField, string>): boolean {
  return (
    !raw.name
    && !raw.address
    && !raw.email
    && !raw.amount
    && !raw.token
    && !raw.network
    && !raw.purpose
    && !raw.description
  );
}

export function parseExpenseImportRows(
  values: string[][],
  maxRows = EXPENSE_FORM_MAX_ROWS,
): { rows: ExpenseDraftRow[]; truncated: boolean } {
  if (!values.length) return { rows: [], truncated: false };
  const headerMap = detectExpenseImportHeaderMap(values[0] ?? []);
  const dataRows = headerMap ? values.slice(1) : values;
  const indexOf = (field: ExpenseImportField) =>
    headerMap?.[field] ?? (headerMap ? undefined : EXPENSE_IMPORT_POSITIONAL[field]);

  const parsed: ExpenseDraftRow[] = [];
  for (const row of dataRows) {
    const raw = {
      name: importCellAt(row, indexOf("name")),
      address: importCellAt(row, indexOf("address")),
      email: importCellAt(row, indexOf("email")),
      amount: importCellAt(row, indexOf("amount")),
      token: importCellAt(row, indexOf("token")),
      network: importCellAt(row, indexOf("network")),
      purpose: importCellAt(row, indexOf("purpose")),
      description: importCellAt(row, indexOf("description")),
    };
    if (isEmptyExpenseImportRaw(raw)) continue;
    parsed.push({
      id: crypto.randomUUID(),
      name: fallbackExpenseImportName(raw.name, raw.email, raw.address),
      address: raw.address,
      email: raw.email,
      token: raw.token,
      network: raw.network,
      amount: raw.amount,
      purpose: raw.purpose,
      description: raw.description,
    });
  }
  return {
    rows: parsed.slice(0, maxRows),
    truncated: parsed.length > maxRows,
  };
}

export function formRowsToImportPayload(
  rows: ExpenseFormRow[],
  title: string,
): { title: string; items: ExpenseImportItem[] } {
  return {
    title: title.trim().slice(0, EXPENSE_IMPORT_LIMITS.title),
    items: rows.map((row) => {
      const symbol = row.token?.symbol ?? normalizeSymbol(row.rawToken) ?? row.rawToken;
      const item: ExpenseImportItem = {
        name: row.name.trim().slice(0, EXPENSE_IMPORT_LIMITS.name),
        address: row.address.trim().slice(0, EXPENSE_IMPORT_LIMITS.address),
        amount: row.amount.trim(),
        network: (row.token?.blockchain ?? row.rawNetwork).slice(
          0,
          EXPENSE_IMPORT_LIMITS.network,
        ),
        symbol: symbol.slice(0, EXPENSE_IMPORT_LIMITS.symbol),
      };
      const email = row.email.trim().slice(0, EXPENSE_IMPORT_LIMITS.email);
      if (email) item.email = email;
      const purpose = row.purpose.trim().slice(0, EXPENSE_IMPORT_LIMITS.purpose);
      if (purpose) item.purpose = purpose;
      const description = row.description.trim().slice(0, EXPENSE_IMPORT_LIMITS.description);
      if (description) item.description = description;
      return item;
    }),
  };
}
