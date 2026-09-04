import { format, subDays, subMonths, subWeeks } from "date-fns";
import { VOLUME_PERIOD, type VolumePeriod } from "@/types/payout";
import type { EmployeeOverviewVolumePoint } from "@/hooks/use-employee-overview-api";
import { OVERVIEW_VOLUME_BUCKETS } from "./config";

export function greetingName(name: string | null | undefined): string {
  const trimmed = name?.trim() ?? "";
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

export function emptyVolumeBuckets(
  period: VolumePeriod,
  now: Date = new Date(),
): EmployeeOverviewVolumePoint[] {
  const count = OVERVIEW_VOLUME_BUCKETS[period];
  return Array.from({ length: count }, (_, index) => {
    const offset = count - 1 - index;
    const date =
      period === VOLUME_PERIOD.Daily
        ? subDays(now, offset)
        : period === VOLUME_PERIOD.Weekly
          ? subWeeks(now, offset)
          : subMonths(now, offset);
    const label = period === VOLUME_PERIOD.Monthly ? format(date, "MMM") : format(date, "MMM d");
    return { label, income: 0, payout: 0, incomeTx: 0, payoutTx: 0 };
  });
}

export function volumeChartPoints(
  period: VolumePeriod,
  series: EmployeeOverviewVolumePoint[] | undefined,
  now: Date = new Date(),
): EmployeeOverviewVolumePoint[] {
  if (series && series.length > 0) return series;
  return emptyVolumeBuckets(period, now);
}

export function formatVolumeAxis(value: number): string {
  if (value === 0) return "$0";
  if (Math.abs(value) >= 1000) {
    const k = value / 1000;
    const text = Number.isInteger(k) ? String(k) : k.toFixed(1);
    return `$${text}k`;
  }
  return `$${value}`;
}
