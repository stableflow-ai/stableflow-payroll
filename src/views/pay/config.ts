import type { ComponentType } from "react";
import { IconBatchUp, IconDuration, IconRecords, IconUp } from "@/components/icons";
import type { IconProps } from "@/components/icons/types";

export const PAY_NAV_ITEMS = [
  { label: "Single Payout", to: "/pay", icon: IconUp, iconClassName: undefined },
  { label: "Batch Payout", to: "/pay/batch", icon: IconBatchUp, iconClassName: undefined },
  { label: "Request Payment", to: "/pay/request", icon: IconUp, iconClassName: "rotate-180" },
  { label: "Pending Payouts", to: "/pay/pending", icon: IconDuration, iconClassName: undefined },
  { label: "Transaction History", to: "/pay/history", icon: IconRecords, iconClassName: undefined },
] as const satisfies ReadonlyArray<{
  label: string;
  to: string;
  icon: ComponentType<IconProps>;
  iconClassName: string | undefined;
}>;

export const AMOUNT_MAX_DECIMALS = 6;
export const QUOTE_DEBOUNCE_MS = 900;
export const QUICK_PAY_SLIPPAGE_TOLERANCE = 5;
export const ORIGIN_BALANCE_POLL_MS = 20_000;
export const MEMO_MAX_LENGTH = 200;
export const CONTACT_NAME_MAX_LENGTH = 50;
export const EMAIL_MAX_LENGTH = 50;
export const PRIVATE_BY_DEFAULT_LABEL = "Private by default";
export const MEMO_TOOLTIP = "The memo will be displayed in the history, visible only to you";

export const QUICK_PAY_TOAST = {
  INSUFFICIENT_BALANCE: "Insufficient balance",
  COULD_NOT_READ_BALANCE: "Could not read wallet balance",
  UNSUPPORTED_ORIGIN_CHAIN: "Quick Pay currently supports EVM origin tokens only",
  PAYMENT_SUBMITTED: "Payment submitted",
} as const;

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
