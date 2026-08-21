import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInMonths,
  differenceInSeconds,
  differenceInWeeks,
  differenceInYears,
  format,
  isValid,
} from "date-fns";

export const DATE_FORMAT = {
  MonthDay: "monthDay",
  MonthDayYear: "monthDayYear",
  DateTime: "dateTime",
} as const;

export type DateFormatVariant = (typeof DATE_FORMAT)[keyof typeof DATE_FORMAT];

const DATE_FORMAT_PATTERN = {
  [DATE_FORMAT.MonthDay]: "MMM d",
  [DATE_FORMAT.MonthDayYear]: "MMM d, yyyy",
  [DATE_FORMAT.DateTime]: "MMM d, yyyy HH:mm",
} as const;

function toDate(value: Date | string | number): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  if (!isValid(date)) return null;
  return date;
}

export function formatDate(
  value: Date | string | number,
  variant: DateFormatVariant = DATE_FORMAT.DateTime,
): string {
  const date = toDate(value);
  if (!date) return "";
  return format(date, DATE_FORMAT_PATTERN[variant]);
}

export function formatTimeAgo(value: Date | string | number, now: Date = new Date()): string {
  const date = toDate(value);
  if (!date) return "";

  const seconds = Math.abs(differenceInSeconds(now, date));
  if (seconds < 60) return `${seconds} s`;

  const minutes = Math.abs(differenceInMinutes(now, date));
  if (minutes < 60) return plural(minutes, "min", "mins");

  const hours = Math.abs(differenceInHours(now, date));
  if (hours < 24) return plural(hours, "hour", "hours");

  const days = Math.abs(differenceInDays(now, date));
  if (days < 7) return plural(days, "day", "days");

  const weeks = Math.abs(differenceInWeeks(now, date));
  if (weeks < 5) return plural(weeks, "week", "weeks");

  const months = Math.abs(differenceInMonths(now, date));
  if (months < 12) return plural(months, "month", "months");

  const years = Math.abs(differenceInYears(now, date));
  return plural(years, "year", "years");
}

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}
