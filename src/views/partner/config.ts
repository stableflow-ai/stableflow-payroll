import type { ComponentType } from "react";
import {
  IconCode,
  IconKey,
  IconRecords,
  IconRecords2,
  IconSupport,
} from "@/components/icons";
import type { IconProps } from "@/components/icons/types";

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
export const API_KEY_LABEL_MAX_LENGTH = 100;

export const API_KEY_TABLE_COLUMNS =
  "minmax(140px,1.2fr) minmax(180px,1.4fr) minmax(160px,1fr) minmax(72px,auto)";
