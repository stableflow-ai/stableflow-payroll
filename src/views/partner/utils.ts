import { differenceInCalendarDays, format, startOfDay, subDays } from "date-fns";
import { getChainByNetwork } from "@/config/chains";
import {
  isInDateRange,
  lastNDaysRange,
  type DateRangeValue,
} from "@/components/date-range-picker/utils";
import {
  ADDITIONAL_DETAILS_MAX_LENGTH,
  COMPANY_MAX_LENGTH,
  FIRST_NAME_MAX_LENGTH,
  LAST_NAME_MAX_LENGTH,
  PURPOSE_MAX_LENGTH,
  REPORT_AMOUNT_FILTER,
  TELEGRAM_MAX_LENGTH,
  WEBSITE_MAX_LENGTH,
} from "./config";

export { isInDateRange, lastNDaysRange };
export type { DateRangeValue };

export function maskApiKey(key: string): string {
  if (key.length <= 11) return key;
  return `${key.slice(0, 7)}*****${key.slice(-4)}`;
}

function requiredTrimmed(value: string, label: string, max: number): string | null {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required`;
  if (trimmed.length > max) return `${label} must be at most ${max} characters`;
  return null;
}

function optionalTrimmed(value: string, label: string, max: number): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > max) return `${label} must be at most ${max} characters`;
  return null;
}

export function partnerRegistrationError(input: {
  firstName: string;
  lastName: string;
  company: string;
  purpose: string;
  website: string;
  telegram: string;
  additionalDetails: string;
}): string | null {
  return (
    requiredTrimmed(input.firstName, "First name", FIRST_NAME_MAX_LENGTH) ??
    requiredTrimmed(input.lastName, "Last name", LAST_NAME_MAX_LENGTH) ??
    requiredTrimmed(input.company, "Company / business name", COMPANY_MAX_LENGTH) ??
    requiredTrimmed(input.purpose, "Purpose", PURPOSE_MAX_LENGTH) ??
    optionalTrimmed(input.website, "Website / URL", WEBSITE_MAX_LENGTH) ??
    optionalTrimmed(input.telegram, "Telegram handle", TELEGRAM_MAX_LENGTH) ??
    optionalTrimmed(input.additionalDetails, "Additional details", ADDITIONAL_DETAILS_MAX_LENGTH)
  );
}

export function matchesAmountFilter(amount: number, filter: string) {
  if (filter === REPORT_AMOUNT_FILTER.All) return true;
  if (filter === REPORT_AMOUNT_FILTER.Under1k) return amount >= 0 && amount <= 1000;
  if (filter === REPORT_AMOUNT_FILTER.From1kTo10k) return amount > 1000 && amount <= 10000;
  if (filter === REPORT_AMOUNT_FILTER.Over10k) return amount > 10000;
  return true;
}

export function chainBlockchain(network: string) {
  return getChainByNetwork(network)?.blockchain ?? network.toLowerCase();
}

export function eachDateKey(range: DateRangeValue) {
  const keys: string[] = [];
  const days = Math.max(0, differenceInCalendarDays(range.to, range.from));
  for (let i = 0; i <= days; i++) {
    keys.push(format(subDays(startOfDay(range.to), days - i), "yyyy-MM-dd"));
  }
  return keys;
}
