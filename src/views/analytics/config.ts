import { format } from "date-fns";
import { VOLUME_PERIOD, type VolumePeriod } from "@/types/payout";

export type CalendarDay = {
  date: string;
  paymentUsd: number;
  payouts: number;
};

export type AssetShare = {
  symbol: string;
  percent: number;
};

export type NetworkShare = {
  network: string;
  percent: number;
};

export type AnalyticsVolumePoint = {
  label: string;
  value: number;
  changePercent: number | null;
};

export type AssetToken = {
  symbol: string;
  network: string;
};

export type LatestPayout = {
  id: string;
  statusLabel: string;
  time: string;
  origin: AssetToken;
  dest: AssetToken;
};

export const DEFAULT_MONTH = format(new Date(), "yyyy-MM");
export const DEFAULT_VOLUME_PERIOD = VOLUME_PERIOD.Monthly;
export const PAYOUT_NETWORKS_LIMIT = 5;
export const LATEST_PAYOUTS_LIMIT = 6;

export const ASSET_COLORS: Record<string, string> = {
  USDT: "#000000",
  USDC: "#AAAAAA",
  ETH: "#627EEA",
  BNB: "#F3BA2F",
  DAI: "#F5AC37",
  TRX: "#FF0013",
  SOL: "#9945FF",
  AVAX: "#E84142",
  NEAR: "#000000",
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

export const VOLUME_PERIOD_OPTIONS = [
  { value: VOLUME_PERIOD.Daily, label: "Daily" },
  { value: VOLUME_PERIOD.Weekly, label: "Weekly" },
  { value: VOLUME_PERIOD.Monthly, label: "Monthly" },
] as const satisfies ReadonlyArray<{ value: VolumePeriod; label: string }>;
