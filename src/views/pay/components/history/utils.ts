import {
  HISTORY_AMOUNT_FILTER,
  HISTORY_FILTER_ALL,
} from "./config";

export function historyOptionalFilter(value: string): string | undefined {
  return value === HISTORY_FILTER_ALL ? undefined : value;
}

export function historyAmountBounds(filter: string): { min?: number; max?: number } {
  if (filter === HISTORY_AMOUNT_FILTER.Under1k) return { min: 0, max: 1000 };
  if (filter === HISTORY_AMOUNT_FILTER.From1kTo10k) return { min: 1000, max: 10000 };
  if (filter === HISTORY_AMOUNT_FILTER.Over10k) return { min: 10000 };
  return {};
}

export function historyMatchesAmount(amount: string, filter: string): boolean {
  const bounds = historyAmountBounds(filter);
  if (bounds.min == null && bounds.max == null) return true;
  const value = Number(amount.replace(/,/g, ""));
  if (!Number.isFinite(value)) return false;
  if (bounds.min != null && value < bounds.min) return false;
  if (bounds.max != null && value >= bounds.max) return false;
  return true;
}
