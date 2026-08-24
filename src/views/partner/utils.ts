import {
  ADDITIONAL_DETAILS_MAX_LENGTH,
  COMPANY_MAX_LENGTH,
  FIRST_NAME_MAX_LENGTH,
  LAST_NAME_MAX_LENGTH,
  PURPOSE_MAX_LENGTH,
  TELEGRAM_MAX_LENGTH,
  WEBSITE_MAX_LENGTH,
} from "./config";

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
