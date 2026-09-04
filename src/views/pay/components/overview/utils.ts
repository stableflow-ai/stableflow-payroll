import { format, subDays, subMonths, subWeeks } from "date-fns";
import { formatAmount } from "@/utils";
import { VOLUME_PERIOD, type VolumePeriod } from "@/types/payout";
import type { AdminOverviewChartPoint } from "@/hooks/use-admin-overview-api";
import type { EmployeeOverviewVolumePoint } from "@/hooks/use-employee-overview-api";
import {
  ADMIN_CHART_PLOT_RIGHT_MARGIN,
  ADMIN_CHART_X_TICK_CHAR_PX,
  ADMIN_CHART_X_TICK_GAP_PX,
  ADMIN_CHART_Y_AXIS_WIDTH,
  CHART_METRIC,
  OVERVIEW_VOLUME_BUCKETS,
  type ChartMetric,
} from "./config";

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

export function emptyAdminChartBuckets(
  period: VolumePeriod,
  now: Date = new Date(),
): AdminOverviewChartPoint[] {
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
    return { label, volume: 0, transaction: 0 };
  });
}

export function adminChartPoints(
  period: VolumePeriod,
  series: AdminOverviewChartPoint[] | undefined,
  now: Date = new Date(),
): AdminOverviewChartPoint[] {
  if (series && series.length > 0) return series;
  return emptyAdminChartBuckets(period, now);
}

export function formatAdminChartAxis(value: number, metric: ChartMetric): string {
  if (metric === CHART_METRIC.Transaction) {
    return formatAmount(value, { prefix: "", maxDecimals: 0 });
  }
  if (value === 0) return "$0";
  if (Math.abs(value) >= 1000) {
    const k = value / 1000;
    const text = Number.isInteger(k) ? String(k) : k.toFixed(1);
    return `$${text}K`;
  }
  return formatAmount(value);
}

export function adminChartYTicks(maxValue: number, metric: ChartMetric): number[] {
  const niceMax = niceCeil(maxValue);
  if (metric === CHART_METRIC.Transaction) {
    const step = Math.max(1, Math.ceil(niceMax / 5));
    const top = step * 5;
    return [0, step, 2 * step, 3 * step, 4 * step, top];
  }
  const step = niceMax / 5;
  return [0, step, 2 * step, 3 * step, 4 * step, niceMax];
}

export function chartXTickMinPx(labels: string[]): number {
  const longest = labels.reduce((max, label) => Math.max(max, label.length), 0);
  return longest * ADMIN_CHART_X_TICK_CHAR_PX + ADMIN_CHART_X_TICK_GAP_PX;
}

export function maxCategoryTicks(hostWidth: number, minTickPx: number): number {
  const plotWidth = hostWidth - ADMIN_CHART_Y_AXIS_WIDTH - ADMIN_CHART_PLOT_RIGHT_MARGIN;
  if (plotWidth <= 0 || minTickPx <= 0) return Number.POSITIVE_INFINITY;
  return Math.max(2, Math.floor(plotWidth / minTickPx) + 1);
}

export function evenCategoryTicks(labels: string[], maxTicks: number): string[] {
  if (maxTicks < 2 || labels.length <= maxTicks) return labels;
  const step = Math.ceil((labels.length - 1) / (maxTicks - 1));
  const ticks: string[] = [];
  for (let i = labels.length - 1; i >= 0; i -= step) ticks.unshift(labels[i]);
  return ticks;
}

function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
}
