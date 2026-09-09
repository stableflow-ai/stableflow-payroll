import { HISTORY_STATUS, HISTORY_TYPE, type HistoryType } from "@/types/history";
import { formatAmount } from "@/utils";
import {
  HISTORY_AMOUNT_INCOME_CLASS,
  HISTORY_AMOUNT_PAYOUT_CLASS,
  HISTORY_FILTER_ALL,
  HISTORY_STATUS_FAILED_CLASS,
  HISTORY_STATUS_OPTIONS,
  HISTORY_STATUS_OTHER_CLASS,
  HISTORY_STATUS_SUCCESS_CLASS,
  HISTORY_TYPE_OPTIONS,
} from "./config";

export function historyOptionalFilter(value: string): string | undefined {
  return value === HISTORY_FILTER_ALL ? undefined : value;
}

export function historyStatusLabel(status: string): string {
  const value = status.trim().toLowerCase();
  if (!value) return "-";
  const option = HISTORY_STATUS_OPTIONS.find((item) => item.value === value);
  if (option && option.value !== HISTORY_FILTER_ALL) return option.label;
  return value;
}

export function historyStatusClass(status: string): string {
  const value = status.trim().toLowerCase();
  if (value === HISTORY_STATUS.Completed || value === "success") {
    return HISTORY_STATUS_SUCCESS_CLASS;
  }
  if (value === HISTORY_STATUS.Failed || value === HISTORY_STATUS.Expired) {
    return HISTORY_STATUS_FAILED_CLASS;
  }
  return HISTORY_STATUS_OTHER_CLASS;
}

export function historyTypeLabel(type: HistoryType | null | undefined): string {
  if (!type) return "-";
  const option = HISTORY_TYPE_OPTIONS.find((item) => item.value === type);
  if (option && option.value !== HISTORY_FILTER_ALL) return option.label;
  return "-";
}

export function historyAmountDisplay(
  amount: string,
  type: HistoryType | null,
): { text: string; className: string } {
  const unsigned = formatAmount(amount, { prefix: "", showDust: true }).replace(/^-/, "");
  if (type === HISTORY_TYPE.Income) {
    return { text: `+${unsigned}`, className: HISTORY_AMOUNT_INCOME_CLASS };
  }
  if (type === HISTORY_TYPE.Payout) {
    return { text: `-${unsigned}`, className: HISTORY_AMOUNT_PAYOUT_CLASS };
  }
  return { text: formatAmount(amount, { prefix: "", showDust: true }), className: "" };
}
