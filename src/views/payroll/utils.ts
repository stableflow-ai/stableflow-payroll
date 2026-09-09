import { format, isValid } from "date-fns";
import type { IntentsToken } from "@/stores/intents-tokens";
import { normalizeSymbol } from "@/stores/intents-tokens";
import { unparseCsv } from "@/lib/import/csv";
import type {
  PayrollChartPoint,
  PayrollHistoryDetailRow,
  PayrollHistoryRun,
  PayrollImportDayType,
  PayrollImportItem,
  PayrollTotalPayoutPeriod,
  PayrollTotalPayoutPoint,
  PayrollUpdateItem,
} from "@/types/payroll";
import { PAYROLL_IMPORT_DAY_TYPE, PAYROLL_TOTAL_PAYOUT_PERIOD } from "@/types/payroll";
import { DATE_FORMAT, formatAddress, formatDate, type WalletChainKind } from "@/utils";
import { Big } from "@/utils";
import {
  amountError,
  detectAddressKind,
  resolveImportToken,
  type FindTokenByChainAndSymbol,
} from "@/views/pay/batch-utils";
import { isValidEmail, stampDownloadFilename } from "@/views/pay/utils";
import type { PayrollNextRun, PayrollRecipientRow } from "@/mocks/payroll";
import {
  PAYROLL_FORM_MAX_ROWS,
  PAYROLL_HISTORY_MONTH_EXPORT_COLUMNS,
  PAYROLL_HISTORY_MONTH_EXPORT_FILENAME,
  PAYROLL_NEXT_EXPORT_COLUMNS,
  PAYROLL_NEXT_EXPORT_FILENAME,
  PAYROLL_PAY_DAY,
  payrollPayDayLabel,
} from "./config";

export type PayrollFormRow = {
  id: string;
  name: string;
  address: string;
  email: string;
  memo: string;
  chainKind: WalletChainKind | null;
  addressError: string | null;
  amount: string;
  token: IntentsToken | null;
  rawToken: string;
  rawNetwork: string;
};

export type PayrollFormRowPatch = Partial<
  Pick<PayrollFormRow, "name" | "address" | "email" | "amount" | "token">
>;

export function payrollEmailError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return isValidEmail(trimmed) ? null : "Enter a valid email";
}

export function defaultPayrollPayDay(): number {
  return PAYROLL_PAY_DAY.First;
}

export function normalizePayrollPayDay(day: number): number {
  if (!Number.isInteger(day) || day < PAYROLL_PAY_DAY.First) return PAYROLL_PAY_DAY.First;
  if (day > PAYROLL_PAY_DAY.Last) return PAYROLL_PAY_DAY.Last;
  return day;
}

export function payrollPayDayToParam(day: number): {
  payrollDayType: PayrollImportDayType;
  payrollDay?: number;
} {
  const payDay = normalizePayrollPayDay(day);
  if (payDay === PAYROLL_PAY_DAY.First) {
    return { payrollDayType: PAYROLL_IMPORT_DAY_TYPE.FirstDay };
  }
  if (payDay === PAYROLL_PAY_DAY.Last) {
    return { payrollDayType: PAYROLL_IMPORT_DAY_TYPE.LastDay };
  }
  return {
    payrollDayType: PAYROLL_IMPORT_DAY_TYPE.DayOfMonth,
    payrollDay: payDay,
  };
}

export function payrollPayDayToType(day: number): PayrollImportDayType {
  return payrollPayDayToParam(day).payrollDayType;
}

export function payrollTypeToPayDay(
  type: PayrollImportDayType,
  day?: number | null,
): number {
  if (type === PAYROLL_IMPORT_DAY_TYPE.FirstDay) return PAYROLL_PAY_DAY.First;
  if (type === PAYROLL_IMPORT_DAY_TYPE.LastDay) return PAYROLL_PAY_DAY.Last;
  return normalizePayrollPayDay(day ?? PAYROLL_PAY_DAY.First);
}

export function payDayFromPaymentDate(value: string | undefined): number {
  const text = value?.trim() ?? "";
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!iso) return defaultPayrollPayDay();
  const year = Number(iso[1]);
  const month = Number(iso[2]);
  const day = Number(iso[3]);
  if (!year || !month || !day) return defaultPayrollPayDay();
  if (day === PAYROLL_PAY_DAY.First) return PAYROLL_PAY_DAY.First;
  const lastDay = new Date(year, month, 0).getDate();
  if (day === lastDay) return PAYROLL_PAY_DAY.Last;
  if (day > PAYROLL_PAY_DAY.First && day < PAYROLL_PAY_DAY.Last) return day;
  return defaultPayrollPayDay();
}

export function payrollNextRunToPayDay(run: {
  payrollDayType?: PayrollImportDayType;
  payrollDay?: number;
  payDate: string;
} | null | undefined): number {
  if (!run) return defaultPayrollPayDay();
  if (run.payrollDayType === PAYROLL_IMPORT_DAY_TYPE.FirstDay) return PAYROLL_PAY_DAY.First;
  if (run.payrollDayType === PAYROLL_IMPORT_DAY_TYPE.LastDay) return PAYROLL_PAY_DAY.Last;
  if (
    run.payrollDayType === PAYROLL_IMPORT_DAY_TYPE.DayOfMonth
    && run.payrollDay != null
    && run.payrollDay >= PAYROLL_PAY_DAY.First
    && run.payrollDay <= PAYROLL_PAY_DAY.Last
  ) {
    return normalizePayrollPayDay(run.payrollDay);
  }
  return payDayFromPaymentDate(run.payDate);
}

export function createEmptyPayrollFormRow(): PayrollFormRow {
  const detected = detectAddressKind("");
  return {
    id: crypto.randomUUID(),
    name: "",
    address: "",
    email: "",
    memo: "",
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
    email: row.email,
    memo: row.memo ?? "",
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
    !payrollEmailError(row.email) &&
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
  payDay: number,
): PayrollNextRun {
  const mapped: PayrollRecipientRow[] = rows.map((row) => {
    const symbol = row.token?.symbol ?? normalizeSymbol(row.rawToken) ?? row.rawToken;
    const network = row.token?.blockchain ?? row.rawNetwork;
    return {
      id: row.id,
      name: row.name.trim(),
      address: row.address.trim(),
      email: row.email.trim(),
      token: symbol,
      network,
      amount: row.amount.trim(),
      netPay: row.amount.trim(),
      memo: row.memo.trim() || undefined,
    };
  });
  const schedule = payrollPayDayToParam(payDay);
  return {
    totalPayout: sumPayrollFormAmounts(rows),
    recipients: mapped.length,
    payDate: payrollPayDayLabel(normalizePayrollPayDay(payDay)),
    payable: true,
    payrollDayType: schedule.payrollDayType,
    payrollDay: schedule.payrollDay,
    rows: mapped,
  };
}

type PayrollImportField = "name" | "address" | "email" | "amount" | "token" | "network" | "memo";

const PAYROLL_IMPORT_HEADER_ALIASES: Record<PayrollImportField, string[]> = {
  name: ["name", "recipientname", "employeename"],
  address: ["recipient", "address", "wallet", "to", "destination"],
  email: ["email", "mail", "e-mail"],
  amount: ["amount", "value"],
  token: ["token", "symbol", "asset"],
  network: ["network", "chain", "blockchain"],
  memo: ["memo", "note", "comment", "remark", "description"],
};

const PAYROLL_IMPORT_POSITIONAL: Partial<Record<PayrollImportField, number>> = {
  address: 0,
  email: 1,
  amount: 2,
  token: 3,
  network: 4,
  memo: 5,
};

function normalizeImportHeader(cell: string): string {
  return cell.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function detectPayrollImportHeaderMap(row: string[]): Partial<Record<PayrollImportField, number>> | null {
  const map: Partial<Record<PayrollImportField, number>> = {};
  row.forEach((cell, index) => {
    const normalized = normalizeImportHeader(cell);
    (Object.keys(PAYROLL_IMPORT_HEADER_ALIASES) as PayrollImportField[]).forEach((field) => {
      if (map[field] != null) return;
      const match = PAYROLL_IMPORT_HEADER_ALIASES[field].some(
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

function isEmptyPayrollImportRaw(raw: Record<PayrollImportField, string>): boolean {
  return !raw.name && !raw.address && !raw.email && !raw.amount && !raw.token && !raw.network && !raw.memo;
}

export function fallbackPayrollImportName(name: string, email: string, address: string): string {
  const trimmedName = name.trim().slice(0, 50);
  if (trimmedName) return trimmedName;
  const local = email.trim().split("@")[0]?.trim() ?? "";
  if (local) return local.slice(0, 50);
  const shortened = formatAddress(address, 6, 4).trim();
  return (shortened || address.trim()).slice(0, 50);
}

export function parsePayrollImportRows(
  values: string[][],
  maxRows = PAYROLL_FORM_MAX_ROWS,
): { rows: PayrollRecipientRow[]; truncated: boolean } {
  if (!values.length) return { rows: [], truncated: false };
  const headerMap = detectPayrollImportHeaderMap(values[0] ?? []);
  const dataRows = headerMap ? values.slice(1) : values;
  const indexOf = (field: PayrollImportField) =>
    headerMap?.[field] ?? (headerMap ? undefined : PAYROLL_IMPORT_POSITIONAL[field]);

  const parsed: PayrollRecipientRow[] = [];
  for (const row of dataRows) {
    const raw = {
      name: importCellAt(row, indexOf("name")),
      address: importCellAt(row, indexOf("address")),
      email: importCellAt(row, indexOf("email")),
      amount: importCellAt(row, indexOf("amount")),
      token: importCellAt(row, indexOf("token")),
      network: importCellAt(row, indexOf("network")),
      memo: importCellAt(row, indexOf("memo")),
    };
    if (isEmptyPayrollImportRaw(raw)) continue;
    const amount = raw.amount;
    parsed.push({
      id: crypto.randomUUID(),
      name: fallbackPayrollImportName(raw.name, raw.email, raw.address),
      address: raw.address,
      email: raw.email,
      token: raw.token,
      network: raw.network,
      amount,
      netPay: amount,
      memo: raw.memo || undefined,
    });
  }
  return {
    rows: parsed.slice(0, maxRows),
    truncated: parsed.length > maxRows,
  };
}

export function recipientRowsToImportItems(rows: PayrollRecipientRow[]): PayrollImportItem[] {
  return rows.map((row) => {
    const item: PayrollImportItem = {
      name: row.name.trim(),
      address: row.address.trim(),
      amount: row.amount.trim(),
      network: row.network,
      symbol: row.token,
    };
    const email = row.email.trim();
    if (email) item.email = email;
    const description = row.memo?.trim() ?? "";
    if (description) item.description = description;
    return item;
  });
}

/** Server salary ids are positive integers. New drawer rows use UUIDs. */
export function payrollSalaryItemId(id: string): number | undefined {
  const trimmed = id.trim();
  if (!/^\d+$/.test(trimmed)) return undefined;
  const value = Number(trimmed);
  return Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

/** Maps Next Payroll net-pay edits onto payable item ids for quote adjustments. */
export function payrollNetPayToPayableOverrides(
  netPayById: Record<string, string>,
): Record<number, string> {
  const next: Record<number, string> = {};
  for (const [id, value] of Object.entries(netPayById)) {
    const itemId = payrollSalaryItemId(id);
    if (itemId == null) continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    next[itemId] = trimmed;
  }
  return next;
}

export function recipientRowsToUpdateItems(rows: PayrollRecipientRow[]): PayrollUpdateItem[] {
  return rows.map((row) => {
    const item: PayrollUpdateItem = {
      name: row.name.trim(),
      address: row.address.trim(),
      amount: row.amount.trim(),
      network: row.network,
      symbol: row.token,
    };
    const id = payrollSalaryItemId(row.id);
    if (id != null) item.id = id;
    const email = row.email.trim();
    if (email) item.email = email;
    return item;
  });
}

export function payrollUpdateDeleteIds(
  originalRows: PayrollRecipientRow[],
  savedRows: PayrollRecipientRow[],
): number[] {
  const kept = new Set<number>();
  for (const row of savedRows) {
    const id = payrollSalaryItemId(row.id);
    if (id != null) kept.add(id);
  }
  const deleted: number[] = [];
  for (const row of originalRows) {
    const id = payrollSalaryItemId(row.id);
    if (id != null && !kept.has(id)) deleted.push(id);
  }
  return deleted;
}

function chartPointValue(volume: string): number {
  const parsed = Number(volume);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function mapPayrollChartSeries(
  points: PayrollTotalPayoutPoint[],
  period: PayrollTotalPayoutPeriod = PAYROLL_TOTAL_PAYOUT_PERIOD.Month,
): {
  points: PayrollChartPoint[];
  periodLabel: string;
  currentValue: string;
} {
  const axisFormat =
    period === PAYROLL_TOTAL_PAYOUT_PERIOD.Month ? DATE_FORMAT.Month : DATE_FORMAT.MonthDay;
  const mapped: PayrollChartPoint[] = points.map((point) => ({
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
          period === PAYROLL_TOTAL_PAYOUT_PERIOD.Month ? "MMMM, yyyy" : "MMMM d, yyyy",
        )
      : "";

  return {
    points: chartPoints,
    periodLabel,
    currentValue: active?.volume ?? "0",
  };
}

export function payrollHistoryRunStub(executionId: string): PayrollHistoryRun {
  return {
    id: executionId,
    title: "",
    status: "pending",
    paidCount: 0,
    recipientCount: 0,
    totalPayout: "0",
    transactionCount: 0,
    failedCount: 0,
    executedAt: "",
  };
}

export function payrollExecutionItemId(id: string): number | null {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export function sanitizeDownloadBasename(value: string, fallback: string): string {
  const cleaned = value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || fallback;
}

export function payrollNextRowsToCsv(rows: readonly PayrollRecipientRow[]): string {
  return unparseCsv([
    [...PAYROLL_NEXT_EXPORT_COLUMNS],
    ...rows.map((row) => [
      row.name,
      row.address,
      row.email,
      row.amount,
      row.token,
      row.network,
      row.memo ?? "",
    ]),
  ]);
}

export function payrollHistoryDetailToCsv(
  rows: readonly PayrollHistoryDetailRow[],
): string {
  return unparseCsv([
    [...PAYROLL_HISTORY_MONTH_EXPORT_COLUMNS],
    ...rows.map((row) => [
      row.name,
      row.email,
      row.address,
      row.token,
      row.network,
      row.amount,
      row.netPay,
      row.status,
    ]),
  ]);
}

function saveCsvFile(filename: string, csv: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = stampDownloadFilename(filename);
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportPayrollNextCsv(rows: readonly PayrollRecipientRow[]) {
  saveCsvFile(PAYROLL_NEXT_EXPORT_FILENAME, payrollNextRowsToCsv(rows));
}

export function exportPayrollHistoryMonthCsv(
  title: string,
  rows: readonly PayrollHistoryDetailRow[],
) {
  const basename = `${sanitizeDownloadBasename(
    title,
    PAYROLL_HISTORY_MONTH_EXPORT_FILENAME.replace(/\.csv$/i, ""),
  )}.csv`;
  saveCsvFile(basename, payrollHistoryDetailToCsv(rows));
}
