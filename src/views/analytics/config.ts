import { DEFAULT_ANALYTICS_MONTH, VOLUME_RANGE } from "@/mocks/analytics";

export const DEFAULT_MONTH = DEFAULT_ANALYTICS_MONTH;
export const DEFAULT_VOLUME_RANGE = VOLUME_RANGE.Monthly;

export const ASSET_COLORS: Record<string, string> = {
  USDT: "#000000",
  USDC: "#AAAAAA",
  PYUSD: "#DFDFDF",
};

export const ASSET_COLOR_FALLBACK = ["#000000", "#AAAAAA", "#DFDFDF", "#606060"];

export const CHART_BAR_ACTIVE = "#000000";
export const CHART_BAR_MUTED = "#E3E3E3";
export const CHANGE_UP_BG = "#D0F348";
export const CHANGE_DOWN_BG = "#FF4B4E";
export const CALENDAR_PAYOUT_BG = "#D0F348";

export const WEEKDAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

export const MONTH_SHORT_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export const VOLUME_RANGE_OPTIONS = [
  { value: VOLUME_RANGE.Daily, label: "Daily" },
  { value: VOLUME_RANGE.Weekly, label: "Weekly" },
  { value: VOLUME_RANGE.Monthly, label: "Monthly" },
  { value: VOLUME_RANGE.All, label: "All" },
] as const;
