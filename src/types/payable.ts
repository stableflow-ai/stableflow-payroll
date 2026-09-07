export const PAYABLE_TYPE = {
  Payroll: "payroll",
  Expense: "expense",
  Bonus: "bonus",
} as const;

export type PayableType = (typeof PAYABLE_TYPE)[keyof typeof PAYABLE_TYPE];

export type PayableKey =
  | { type: typeof PAYABLE_TYPE.Payroll; periodMonth: string }
  | { type: typeof PAYABLE_TYPE.Expense | typeof PAYABLE_TYPE.Bonus; batchId: number };

export interface PayableItem {
  id: number;
  name: string;
  email: string;
  address: string;
  network: string;
  symbol: string;
  amount: string;
  netPay: string;
  purpose: string;
  status: string;
}

export interface Payable {
  key: PayableKey;
  type: PayableType;
  title: string;
  totalPayout: string;
  totalCount: number;
  paymentDate: string;
  periodMonth: string;
  batchId: number;
  items: PayableItem[];
}

export interface PayablePayAdjustment {
  item_id: number;
  net_pay: string;
}

export interface PayablePayBaseParam {
  organization_id: number;
  payer: string;
  source_network: string;
  source_symbol: string;
  notification?: number[];
  adjustments?: PayablePayAdjustment[];
}

export interface PayrollPayParam extends PayablePayBaseParam {
  period_month: string;
  timezone: string;
}

export type PayablePayRequest =
  | ({ type: typeof PAYABLE_TYPE.Payroll } & PayrollPayParam)
  | ({ type: typeof PAYABLE_TYPE.Expense | typeof PAYABLE_TYPE.Bonus; batchId: number } & PayablePayBaseParam);

export function payableKeyId(key: PayableKey): string {
  if (key.type === PAYABLE_TYPE.Payroll) return `${PAYABLE_TYPE.Payroll}:${key.periodMonth}`;
  return `${key.type}:${key.batchId}`;
}

export function parsePayableKey(id: string): PayableKey | null {
  const trimmed = id.trim();
  const sep = trimmed.indexOf(":");
  if (sep <= 0) return null;
  const type = trimmed.slice(0, sep);
  const rest = trimmed.slice(sep + 1);
  if (!rest) return null;
  if (type === PAYABLE_TYPE.Payroll) {
    return { type: PAYABLE_TYPE.Payroll, periodMonth: rest };
  }
  if (type === PAYABLE_TYPE.Expense || type === PAYABLE_TYPE.Bonus) {
    if (!/^-?\d+$/.test(rest)) return null;
    return { type, batchId: Number(rest) };
  }
  return null;
}

export function findPayable(
  list: readonly Payable[],
  key: PayableKey,
): Payable | null {
  const id = payableKeyId(key);
  return list.find((row) => payableKeyId(row.key) === id) ?? null;
}

export function findExpensePayable(
  list: readonly Payable[],
  batchId: number,
): Payable | null {
  return list.find(
    (row) => row.type === PAYABLE_TYPE.Expense && row.batchId === batchId,
  ) ?? null;
}

/** Omits `notification` when nothing is selected. */
export function payableNotificationIds(ids: readonly number[]): number[] | undefined {
  const unique = [...new Set(ids.filter((id) => Number.isFinite(id)))].sort((a, b) => a - b);
  return unique.length ? unique : undefined;
}

export function effectiveNetPay(
  item: PayableItem,
  overrides: Record<number, string>,
): string {
  const override = overrides[item.id];
  return override !== undefined ? override : item.netPay;
}

/** One `{ item_id, net_pay }` per row. Omits the field when the form has no items. */
export function payableAdjustments(
  items: readonly PayableItem[],
  overrides: Record<number, string>,
): PayablePayAdjustment[] | undefined {
  if (!items.length) return undefined;
  return items.map((item) => ({
    item_id: item.id,
    net_pay: effectiveNetPay(item, overrides),
  }));
}
