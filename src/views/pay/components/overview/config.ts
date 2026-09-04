import { VOLUME_PERIOD, type VolumePeriod } from "@/types/payout";

export const DEFAULT_OVERVIEW_VOLUME_PERIOD = VOLUME_PERIOD.Monthly;

export const OVERVIEW_VOLUME_PERIOD_OPTIONS = [
  { value: VOLUME_PERIOD.Daily, label: "Daily" },
  { value: VOLUME_PERIOD.Weekly, label: "Weekly" },
  { value: VOLUME_PERIOD.Monthly, label: "Monthly" },
] as const satisfies ReadonlyArray<{ value: VolumePeriod; label: string }>;

export const OVERVIEW_INCOME_COLOR = "#7cce00";
export const OVERVIEW_PAYOUT_COLOR = "#ca76ff";
export const OVERVIEW_CHART_GRID = "#e3e3e3";
export const OVERVIEW_PENDING_COLOR = "#3f8afb";
export const OVERVIEW_VOLUME_BUCKETS = {
  [VOLUME_PERIOD.Daily]: 7,
  [VOLUME_PERIOD.Weekly]: 6,
  [VOLUME_PERIOD.Monthly]: 6,
} as const;

export const RECENT_PAYMENTS_COLUMNS =
  "minmax(88px,0.7fr) minmax(140px,1.3fr) minmax(128px,1fr) minmax(128px,1fr) minmax(72px,0.55fr) minmax(128px,1fr) minmax(140px,1fr) minmax(110px,0.9fr)";
