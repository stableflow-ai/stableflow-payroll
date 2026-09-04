import { VOLUME_PERIOD, type VolumePeriod } from "@/types/payout";

export const DEFAULT_OVERVIEW_VOLUME_PERIOD = VOLUME_PERIOD.Monthly;
export const DEFAULT_ADMIN_OVERVIEW_VOLUME_PERIOD = VOLUME_PERIOD.Daily;

export const OVERVIEW_VOLUME_PERIOD_OPTIONS = [
  { value: VOLUME_PERIOD.Daily, label: "Daily" },
  { value: VOLUME_PERIOD.Weekly, label: "Weekly" },
  { value: VOLUME_PERIOD.Monthly, label: "Monthly" },
] as const satisfies ReadonlyArray<{ value: VolumePeriod; label: string }>;

export const OVERVIEW_INCOME_COLOR = "#7cce00";
export const OVERVIEW_PAYOUT_COLOR = "#ca76ff";
export const OVERVIEW_CHART_GRID = "#e3e3e3";
export const OVERVIEW_PENDING_COLOR = "#3f8afb";
export const OVERVIEW_LINK_CLASS =
  "font-montserrat text-xs font-medium capitalize text-[#3f8afb] hover:text-[#3f8afb]/80";

export const CHART_METRIC = {
  Volume: "volume",
  Transaction: "transaction",
} as const;

export type ChartMetric = (typeof CHART_METRIC)[keyof typeof CHART_METRIC];

export const CHART_METRIC_OPTIONS = [
  { value: CHART_METRIC.Volume, label: "Volume" },
  { value: CHART_METRIC.Transaction, label: "Transaction" },
] as const satisfies ReadonlyArray<{ value: ChartMetric; label: string }>;

export const CHART_METRIC_COLOR: Record<ChartMetric, string> = {
  [CHART_METRIC.Volume]: "#6284F5",
  [CHART_METRIC.Transaction]: "#84A20F",
};

export const ADMIN_CHART_Y_AXIS_WIDTH = 48;
export const ADMIN_CHART_PLOT_RIGHT_MARGIN = 12;
export const ADMIN_CHART_X_TICK_CHAR_PX = 7;
export const ADMIN_CHART_X_TICK_GAP_PX = 16;
export const OVERVIEW_VOLUME_BUCKETS = {
  [VOLUME_PERIOD.Daily]: 7,
  [VOLUME_PERIOD.Weekly]: 6,
  [VOLUME_PERIOD.Monthly]: 6,
} as const;

export const RECENT_PAYMENTS_COLUMNS =
  "minmax(88px,0.7fr) minmax(140px,1.3fr) minmax(128px,1fr) minmax(128px,1fr) minmax(72px,0.55fr) minmax(128px,1fr) minmax(140px,1fr) minmax(110px,0.9fr)";
