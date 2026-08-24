import {
  differenceInCalendarDays,
  endOfDay,
  format,
  isSameDay,
  startOfDay,
  subDays,
} from "date-fns";
import { DATE_RANGE_PRESET_OPTIONS } from "./config";

export type DateRangeValue = {
  from: Date;
  to: Date;
};

export function lastNDaysRange(days: number, now: Date = new Date()): DateRangeValue {
  return {
    from: startOfDay(subDays(now, days - 1)),
    to: endOfDay(now),
  };
}

export function matchesLastNDays(range: DateRangeValue, days: number, now: Date = new Date()) {
  const expected = lastNDaysRange(days, now);
  return isSameDay(range.from, expected.from) && isSameDay(range.to, expected.to);
}

export function formatDateRangeLabel(range: DateRangeValue, now: Date = new Date()) {
  const preset = DATE_RANGE_PRESET_OPTIONS.find((option) =>
    matchesLastNDays(range, option.days, now),
  );
  if (preset) return preset.label;
  return `${format(range.from, "MMM d, yyyy")} – ${format(range.to, "MMM d, yyyy")}`;
}

export function isInDateRange(iso: string, range: DateRangeValue) {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return true;
  return time >= range.from.getTime() && time <= range.to.getTime();
}

export function rangeToUnixSeconds(range: DateRangeValue) {
  return {
    start_time: Math.floor(range.from.getTime() / 1000),
    end_time: Math.floor(range.to.getTime() / 1000),
  };
}

export function dateRangeDayCount(range: DateRangeValue) {
  return differenceInCalendarDays(range.to, range.from) + 1;
}
