import { VOLUME_PERIOD, type VolumePeriod } from "@/types/payout";
import { TOKEN_BALANCE_POLL_MS } from "@/components/token-select-dialog/config";

export const DEFAULT_VOLUME_PERIOD = VOLUME_PERIOD.Monthly;
export const HOME_LIST_LIMIT = 6;
export const HOME_BALANCE_POLL_MS = TOKEN_BALANCE_POLL_MS;
export const HOME_BALANCE_CHIP_ROW_HEIGHT_PX = 30;

export const VOLUME_PERIOD_OPTIONS = [
  { value: VOLUME_PERIOD.Daily, label: "Daily" },
  { value: VOLUME_PERIOD.Weekly, label: "Weekly" },
  { value: VOLUME_PERIOD.Monthly, label: "Monthly" },
] as const satisfies ReadonlyArray<{ value: VolumePeriod; label: string }>;

export const HOME_CHART_LINE_COLOR = "#4DA0FF";
export const HOME_STATUS_COMPLETE_CLASS = "text-[#769400]";
export const HOME_STATUS_FAILED_CLASS = "text-danger";
export const RECENT_PAYOUTS_COLUMNS =
  "minmax(140px,1.2fr) minmax(72px,0.5fr) minmax(140px,1fr) minmax(150px,1fr) minmax(120px,0.8fr)";
