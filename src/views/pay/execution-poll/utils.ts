import { queryKeys } from "@/api/query-keys";
import {
  PAYROLL_EXECUTION_ITEM_STATUS,
  type PayrollExecutionItem,
} from "@/types/payout";
import { isOperationPayableType, PAYABLE_TYPE } from "@/types/payable";
import { formatAddress } from "@/utils";
import { BONUS_HISTORY_PATH } from "@/views/bonus/config";
import { categoryHistoryPath } from "@/views/categories/config";
import { EXPENSE_HISTORY_PATH } from "@/views/expense/config";
import { HISTORY_PATH } from "@/views/pay/config";
import { PAYROLL_HISTORY_PATH } from "@/views/payroll/config";
import {
  EXECUTION_ITEM_ADDRESS_PREFIX,
  EXECUTION_ITEM_ADDRESS_SUFFIX,
} from "./config";

const TERMINAL_STATUSES = new Set<string>(Object.values(PAYROLL_EXECUTION_ITEM_STATUS));

export function executionHistoryPath(type: string): string {
  const normalized = type.trim().toLowerCase();
  if (
    normalized === PAYABLE_TYPE.Payroll
    || normalized === "salary"
    || normalized === "salaries"
  ) {
    return PAYROLL_HISTORY_PATH;
  }
  if (normalized === PAYABLE_TYPE.Expense) return EXPENSE_HISTORY_PATH;
  if (normalized === PAYABLE_TYPE.Bonus) return BONUS_HISTORY_PATH;
  if (isOperationPayableType(normalized)) return categoryHistoryPath(normalized);
  return HISTORY_PATH;
}

export function isExecutionItemTerminal(status: string): boolean {
  return TERMINAL_STATUSES.has(status.trim().toLowerCase());
}

export function newTerminalExecutionItems(
  seenIds: ReadonlySet<number>,
  list: readonly PayrollExecutionItem[],
): PayrollExecutionItem[] {
  return list.filter(
    (item) => isExecutionItemTerminal(item.status) && !seenIds.has(item.id),
  );
}

export function executionItemToastTitle(
  item: Pick<PayrollExecutionItem, "name" | "recipient">,
): string {
  const name = item.name.trim();
  const address = formatAddress(
    item.recipient,
    EXECUTION_ITEM_ADDRESS_PREFIX,
    EXECUTION_ITEM_ADDRESS_SUFFIX,
  ).trim();
  if (name && address) return `Paying to ${name} ${address}`;
  if (name) return `Paying to ${name}`;
  if (address) return `Paying to ${address}`;
  return "Paying";
}

export function executionItemToastText(status: string): string | null {
  const normalized = status.trim().toLowerCase();
  if (normalized === PAYROLL_EXECUTION_ITEM_STATUS.Completed) return "Transaction success!";
  if (normalized === PAYROLL_EXECUTION_ITEM_STATUS.Failed) return "Transaction failed";
  if (normalized === PAYROLL_EXECUTION_ITEM_STATUS.Expired) return "Transaction expired";
  return null;
}

export function executionItemToastKind(status: string): "success" | "fail" | null {
  const normalized = status.trim().toLowerCase();
  if (normalized === PAYROLL_EXECUTION_ITEM_STATUS.Completed) return "success";
  if (
    normalized === PAYROLL_EXECUTION_ITEM_STATUS.Failed
    || normalized === PAYROLL_EXECUTION_ITEM_STATUS.Expired
  ) {
    return "fail";
  }
  return null;
}

const PENDING_STATUS = "pending";

export function pollIntervalIfPending(
  items: ReadonlyArray<{ status: string }> | undefined,
  intervalMs: number,
): number | false {
  if (!items?.some((item) => item.status === PENDING_STATUS)) return false;
  return intervalMs;
}

export function executionProgressMessage(finished: boolean): string {
  return finished ? "Transactions completed" : "Transactions are in progress...";
}

export function payoutStatusQueryKeys(type: string): Array<readonly unknown[]> {
  const normalized = type.trim().toLowerCase();
  if (
    normalized === PAYABLE_TYPE.Payroll
    || normalized === "salary"
    || normalized === "salaries"
  ) {
    return [
      [...queryKeys.payroll.all, "recent"],
      [...queryKeys.payroll.all, "history"],
      [...queryKeys.payroll.all, "history-detail"],
    ];
  }
  if (normalized === PAYABLE_TYPE.Expense) {
    return [
      [...queryKeys.expense.all, "recent"],
      [...queryKeys.expense.all, "history"],
    ];
  }
  if (normalized === PAYABLE_TYPE.Bonus) {
    return [
      [...queryKeys.bonus.all, "recent"],
      [...queryKeys.bonus.all, "history"],
    ];
  }
  if (isOperationPayableType(normalized)) {
    return [
      [...queryKeys.operation.all, "recent"],
      [...queryKeys.operation.all, "history"],
    ];
  }
  return [];
}
