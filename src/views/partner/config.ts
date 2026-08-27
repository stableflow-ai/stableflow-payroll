import type { ComponentType } from "react";
import {
  IconCode,
  IconKey,
  IconRecords,
  IconRecords2,
  IconSupport,
} from "@/components/icons";
import type { IconProps } from "@/components/icons/types";
import { PAYOUT_SYMBOLS } from "@/stores/intents-tokens";

export const PARTNER_NAV_ITEMS = [
  { label: "API Keys", to: "/partner/api-keys", icon: IconKey, lockedUntilPartner: true },
  { label: "Reports", to: "/partner/reports", icon: IconRecords2, lockedUntilPartner: true },
  { label: "Support", to: "/partner/support", icon: IconSupport, lockedUntilPartner: false },
  { label: "Terms of Service", to: "/partner/terms", icon: IconRecords, lockedUntilPartner: false },
  { label: "Developer Docs", to: "/partner/docs", icon: IconCode, lockedUntilPartner: false },
] as const satisfies ReadonlyArray<{
  label: string;
  to: string;
  icon: ComponentType<IconProps>;
  lockedUntilPartner: boolean;
}>;

export const FIRST_NAME_MAX_LENGTH = 100;
export const LAST_NAME_MAX_LENGTH = 100;
export const COMPANY_MAX_LENGTH = 255;
export const WEBSITE_MAX_LENGTH = 500;
export const TELEGRAM_MAX_LENGTH = 128;
export const PURPOSE_MAX_LENGTH = 5000;
export const ADDITIONAL_DETAILS_MAX_LENGTH = 5000;
export const API_KEY_LABEL_MAX_LENGTH = 200;

export const API_KEY_TABLE_COLUMNS =
  "minmax(140px,1.2fr) minmax(180px,1.4fr) minmax(160px,1fr) minmax(72px,auto)";

export const REPORT_FILTER_ALL = "all";

export const REPORT_TIME_PRESET = {
  Days30: 30,
  Days7: 7,
  Days1: 1,
} as const;

export const REPORT_AMOUNT_FILTER = {
  All: "all",
  Under1k: "0-1000",
  From1kTo10k: "1000-10000",
  Over10k: "over-10000",
} as const;

export const REPORT_AMOUNT_OPTIONS = [
  { value: REPORT_AMOUNT_FILTER.All, label: "All" },
  { value: REPORT_AMOUNT_FILTER.Under1k, label: "0-1,000" },
  { value: REPORT_AMOUNT_FILTER.From1kTo10k, label: "1,000-10,000" },
  { value: REPORT_AMOUNT_FILTER.Over10k, label: ">10,000" },
] as const;

export const REPORT_TOKENS = PAYOUT_SYMBOLS;

export const REPORT_PAGE_SIZE = 12;

export const REPORT_VOLUME_CHART_COLOR = "#4DA0FF";
export const REPORT_TX_CHART_COLOR = "#9BA84A";

export const REPORT_TABLE_COLUMNS =
  "minmax(72px,0.6fr) minmax(140px,1.1fr) 28px minmax(88px,0.7fr) minmax(150px,1.2fr) minmax(130px,1fr) minmax(130px,1fr) minmax(140px,1fr)";

export const REPORT_WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

export const REPORT_TIME_PRESET_OPTIONS = [
  { days: REPORT_TIME_PRESET.Days30, label: "Last 30 days" },
  { days: REPORT_TIME_PRESET.Days7, label: "Last 7 days" },
  { days: REPORT_TIME_PRESET.Days1, label: "Last 1 day" },
] as const;
