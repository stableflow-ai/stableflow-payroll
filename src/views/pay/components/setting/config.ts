export const CHANNEL_HANDLE_MAX_LENGTH = 100;

export const FIELD_REQUIREMENT_OPTIONS = [
  { value: "required", label: "Required" },
  { value: "optional", label: "Optional" },
] as const;

export const ADDRESS_SETTING_FIELD = {
  near: "nearAddress",
  solana: "solanaAddress",
  tron: "tronAddress",
} as const;

export const SLACK_CALLBACK_REDIRECT_MS = 1200;
