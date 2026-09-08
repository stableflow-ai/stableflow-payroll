import { format, subDays, subMonths, subWeeks } from "date-fns";
import { chartYTicks, formatAmount, niceCeil } from "@/utils";
import {
  type OrganizationHighPriorityItem,
  type OrganizationPayoutPoint,
} from "@/types/organization";
import { VOLUME_PERIOD, type VolumePeriod } from "@/types/payout";
import type { MemberOverviewPayoutPoint } from "@/types/overview";
import {
  ADMIN_CHART_PLOT_RIGHT_MARGIN,
  ADMIN_CHART_X_TICK_CHAR_PX,
  ADMIN_CHART_X_TICK_GAP_PX,
  ADMIN_CHART_Y_AXIS_WIDTH,
  CHART_METRIC,
  HIGH_PRIORITY_PATH,
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
): MemberOverviewPayoutPoint[] {
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
  series: MemberOverviewPayoutPoint[] | undefined,
  now: Date = new Date(),
): MemberOverviewPayoutPoint[] {
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

export type AdminHighPriorityItem = {
  id: string;
  kind: OrganizationHighPriorityItem["category"];
  title: string;
  subtitle: string;
  to: string;
};

export function highPriorityDisplayItems(
  items: OrganizationHighPriorityItem[],
): AdminHighPriorityItem[] {
  return items.map((item, index) => ({
    id: `hp-${item.category}-${index}`,
    kind: item.category,
    title: item.title,
    subtitle: item.description,
    to: HIGH_PRIORITY_PATH[item.category],
  }));
}

export function emptyAdminChartBuckets(
  period: VolumePeriod,
  now: Date = new Date(),
): OrganizationPayoutPoint[] {
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
  series: OrganizationPayoutPoint[] | undefined,
  now: Date = new Date(),
): OrganizationPayoutPoint[] {
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
  if (metric === CHART_METRIC.Transaction) {
    const niceMax = niceCeil(maxValue);
    const step = Math.max(1, Math.ceil(niceMax / 5));
    const top = step * 5;
    return [0, step, 2 * step, 3 * step, 4 * step, top];
  }
  return chartYTicks(maxValue, 5);
}

export function chartXTickMinPx(labels: string[]): number {
  const longest = labels.reduce((max, label) => Math.max(max, label.length), 0);
  return longest * ADMIN_CHART_X_TICK_CHAR_PX + ADMIN_CHART_X_TICK_GAP_PX;
}

export function maxCategoryTicks(hostWidth: number, minTickPx: number): number {
  const plotWidth = hostWidth - ADMIN_CHART_Y_AXIS_WIDTH - ADMIN_CHART_PLOT_RIGHT_MARGIN;
  if (plotWidth <= 0 || minTickPx <= 0) return 2;
  return Math.max(2, Math.floor(plotWidth / minTickPx) + 1);
}

export function evenCategoryTicks(labels: string[], maxTicks: number): string[] {
  if (labels.length <= 2) return labels;
  if (!Number.isFinite(maxTicks) || maxTicks >= labels.length) return labels;
  const count = Math.max(2, Math.floor(maxTicks));
  const last = labels.length - 1;
  const ticks: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const index = Math.round((i * last) / (count - 1));
    const label = labels[index];
    if (ticks[ticks.length - 1] !== label) ticks.push(label);
  }
  return ticks;
}
