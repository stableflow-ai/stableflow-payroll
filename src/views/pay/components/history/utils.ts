import { HISTORY_STATUS } from "@/types/history";
import {
  HISTORY_FILTER_ALL,
  HISTORY_STATUS_FAILED_CLASS,
  HISTORY_STATUS_OPTIONS,
  HISTORY_STATUS_OTHER_CLASS,
  HISTORY_STATUS_SUCCESS_CLASS,
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
