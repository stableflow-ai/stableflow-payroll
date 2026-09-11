import { Big } from "@/utils";

export const PAYABLE_TYPE = {
  Payroll: "payroll",
  Expense: "expense",
  Bonus: "bonus",
} as const;

export type StaticPayableType = (typeof PAYABLE_TYPE)[keyof typeof PAYABLE_TYPE];

/** Payroll / expense / bonus, or a dynamic operation category such as `office`. */
export type PayableType = string;

export function isStaticPayableType(type: string): type is StaticPayableType {
  return (
    type === PAYABLE_TYPE.Payroll
    || type === PAYABLE_TYPE.Expense
    || type === PAYABLE_TYPE.Bonus
  );
}

export function isOperationPayableType(type: string): boolean {
  return Boolean(type.trim()) && !isStaticPayableType(type);
}

export type PayableKey =
  | { type: typeof PAYABLE_TYPE.Payroll; periodMonth: string }
  | { type: string; batchId: number };

export interface PayableItem {
  id: number;
  name: string;
  email: string;
  address: string;
  network: string;
  symbol: string;
  amount: string;
  volume: string;
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
  refundTo: string;
  source_network: string;
  source_symbol: string;
  notification?: string;
  adjustments?: PayablePayAdjustment[];
}

export interface PayrollPayParam extends PayablePayBaseParam {
  period_month: string;
  timezone: string;
}

export type PayablePayRequest =
  | ({ type: typeof PAYABLE_TYPE.Payroll } & PayrollPayParam)
  | ({ type: string; batchId: number } & PayablePayBaseParam);

export function payableKeyId(key: PayableKey): string {
  if (key.type === PAYABLE_TYPE.Payroll && "periodMonth" in key) {
    return `${PAYABLE_TYPE.Payroll}:${key.periodMonth}`;
  }
  if ("batchId" in key) return `${key.type}:${key.batchId}`;
  return `${key.type}:`;
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
  if (!/^-?\d+$/.test(rest)) return null;
  return { type, batchId: Number(rest) };
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

export const PAYABLE_NOTIFICATION_ALL = "all";

/** `"all"` when every item is selected; otherwise comma-separated ids. Omits when none. */
export function payableNotification(
  selectedIds: readonly number[],
  itemIds: readonly number[],
): string | undefined {
  const items = [...new Set(itemIds.filter((id) => Number.isFinite(id)))];
  const selected = [
    ...new Set(selectedIds.filter((id) => Number.isFinite(id) && items.includes(id))),
  ].sort((a, b) => a - b);
  if (!selected.length) return undefined;
  if (items.length > 0 && selected.length === items.length) return PAYABLE_NOTIFICATION_ALL;
  return selected.join(",");
}

function sameDecimalAmount(left: string, right: string): boolean {
  try {
    return new Big(left).eq(right);
  } catch {
    return left === right;
  }
}

/** `netPay` when the list sent one; otherwise `amount`. */
export function payableItemNetPay(item: PayableItem): string {
  const netPay = item.netPay.trim();
  return netPay || item.amount;
}

export function effectiveNetPay(
  item: PayableItem,
  overrides: Record<number, string>,
): string {
  const override = overrides[item.id];
  if (override !== undefined && override.trim() !== "") return override;
  return payableItemNetPay(item);
}

/** Only rows whose saved net pay differs from the list baseline. */
export function payableAdjustments(
  items: readonly PayableItem[],
  overrides: Record<number, string>,
): PayablePayAdjustment[] | undefined {
  const adjustments: PayablePayAdjustment[] = [];
  for (const item of items) {
    const override = overrides[item.id];
    if (override === undefined || override.trim() === "") continue;
    if (sameDecimalAmount(override, payableItemNetPay(item))) continue;
    adjustments.push({ item_id: item.id, net_pay: override });
  }
  return adjustments.length ? adjustments : undefined;
}

/** Every payroll row's current net pay. Empty or non-positive values are skipped. */
export function payablePayrollAdjustments(
  items: readonly PayableItem[],
  overrides: Record<number, string>,
): PayablePayAdjustment[] | undefined {
  const adjustments: PayablePayAdjustment[] = [];
  for (const item of items) {
    const netPay = effectiveNetPay(item, overrides).trim();
    if (!netPay) continue;
    try {
      if (new Big(netPay).lte(0)) continue;
    } catch {
      continue;
    }
    adjustments.push({ item_id: item.id, net_pay: netPay });
  }
  return adjustments.length ? adjustments : undefined;
}
