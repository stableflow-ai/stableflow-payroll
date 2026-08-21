import { VOLUME_RANGE } from "@/mocks/home";

export const DEFAULT_VOLUME_RANGE = VOLUME_RANGE.Monthly;

export const VOLUME_RANGE_OPTIONS = [
  { value: VOLUME_RANGE.Daily, label: "Daily" },
  { value: VOLUME_RANGE.Weekly, label: "Weekly" },
  { value: VOLUME_RANGE.Monthly, label: "Monthly" },
  { value: VOLUME_RANGE.All, label: "All" },
];

export const HOME_CHART_LINE_COLOR = "#4DA0FF";
export const HOME_STATUS_COMPLETE_CLASS = "text-[#769400]";
export const HOME_STATUS_FAILED_CLASS = "text-[#ff5656]";
export const RECENT_PAYOUTS_COLUMNS =
  "minmax(140px,1.2fr) minmax(72px,0.5fr) minmax(140px,1fr) minmax(150px,1fr) minmax(120px,0.8fr)";
