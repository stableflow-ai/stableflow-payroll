import { payrollHistoryTitle } from "@/api/payroll";
import type { BonusPendingItem } from "@/types/bonus";
import type { ExpenseOpenBatch } from "@/types/expense";
import type { OperationOpenBatch } from "@/types/operation";
import { PAYABLE_TYPE, type Payable, type PayableItem } from "@/types/payable";
import type { PayrollNextRun } from "@/types/payroll";

function positiveItemId(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const id = Number(trimmed);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** Open rows store `"${batchId}-${id}"`; quote notification uses the original item id. */
export function openMemberItemId(compositeId: string, batchId: number): number | null {
  const prefix = `${batchId}-`;
  const rest = compositeId.startsWith(prefix)
    ? compositeId.slice(prefix.length)
    : compositeId;
  return positiveItemId(rest);
}

export function payrollNextToPayable(run: PayrollNextRun): Payable | null {
  const periodMonth = run.payDate.trim();
  if (!periodMonth) return null;
  const items: PayableItem[] = [];
  for (const row of run.rows) {
    const id = positiveItemId(row.id);
    if (id == null) continue;
    items.push({
      id,
      name: row.name,
      email: row.email,
      address: row.address,
      network: row.network,
      symbol: row.token,
      amount: row.amount,
      volume: "",
      netPay: row.netPay,
      purpose: "",
      status: "",
    });
  }
  return {
    key: { type: PAYABLE_TYPE.Payroll, periodMonth },
    type: PAYABLE_TYPE.Payroll,
    title: payrollHistoryTitle(periodMonth),
    totalPayout: run.totalPayout,
    totalCount: run.recipients,
    paymentDate: periodMonth,
    periodMonth,
    batchId: 0,
    items,
  };
}

export function expenseBatchToPayable(batch: ExpenseOpenBatch): Payable | null {
  if (batch.batchId <= 0) return null;
  const items: PayableItem[] = [];
  for (const member of batch.members) {
    const id = openMemberItemId(member.id, batch.batchId);
    if (id == null) continue;
    items.push({
      id,
      name: member.name,
      email: "",
      address: member.address,
      network: member.network,
      symbol: member.token,
      amount: member.amount,
      volume: member.expense,
      netPay: "",
      purpose: member.purpose,
      status: "",
    });
  }
  return {
    key: { type: PAYABLE_TYPE.Expense, batchId: batch.batchId },
    type: PAYABLE_TYPE.Expense,
    title: batch.title,
    totalPayout: batch.volume,
    totalCount: batch.count,
    paymentDate: "",
    periodMonth: "",
    batchId: batch.batchId,
    items,
  };
}

export function bonusItemToPayable(item: BonusPendingItem): Payable | null {
  if (item.batchId <= 0) return null;
  const items: PayableItem[] = [];
  for (const member of item.members) {
    const id = openMemberItemId(member.id, item.batchId);
    if (id == null) continue;
    items.push({
      id,
      name: member.name,
      email: member.email,
      address: member.address,
      network: "",
      symbol: member.token,
      amount: member.amount,
      volume: "",
      netPay: "",
      purpose: "",
      status: "",
    });
  }
  return {
    key: { type: PAYABLE_TYPE.Bonus, batchId: item.batchId },
    type: PAYABLE_TYPE.Bonus,
    title: item.title,
    totalPayout: item.amount,
    totalCount: item.members.length,
    paymentDate: "",
    periodMonth: "",
    batchId: item.batchId,
    items,
  };
}

export function operationBatchToPayable(
  batch: OperationOpenBatch,
  category: string,
): Payable | null {
  const type = category.trim();
  if (!type || batch.batchId <= 0) return null;
  const items: PayableItem[] = [];
  for (const member of batch.members) {
    const id = openMemberItemId(member.id, batch.batchId);
    if (id == null) continue;
    items.push({
      id,
      name: member.name,
      email: "",
      address: member.address,
      network: member.network,
      symbol: member.token,
      amount: member.amount,
      volume: member.expense,
      netPay: "",
      purpose: member.purpose,
      status: "",
    });
  }
  return {
    key: { type, batchId: batch.batchId },
    type,
    title: batch.title,
    totalPayout: batch.volume,
    totalCount: batch.count,
    paymentDate: "",
    periodMonth: "",
    batchId: batch.batchId,
    items,
  };
}

export function findExpenseOpenBatch(
  batches: readonly ExpenseOpenBatch[],
  batchId: number,
): ExpenseOpenBatch | null {
  return batches.find((batch) => batch.batchId === batchId) ?? null;
}
