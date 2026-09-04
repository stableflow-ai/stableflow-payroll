export const FIELD_REQUIREMENT = {
  Required: "required",
  Optional: "optional",
} as const;

export type FieldRequirement = (typeof FIELD_REQUIREMENT)[keyof typeof FIELD_REQUIREMENT];

export type ChannelConfig = {
  enabled: boolean;
  requirement: FieldRequirement;
};

export const INTEGRATION_FIELD = {
  Email: "email",
  Telegram: "telegram",
  Slack: "slack",
  Evm: "evm",
  Solana: "solana",
  Near: "near",
  Tron: "tron",
} as const;

export type IntegrationFieldKey = (typeof INTEGRATION_FIELD)[keyof typeof INTEGRATION_FIELD];

export type IntegrationSettings = Record<IntegrationFieldKey, ChannelConfig>;

export function defaultIntegrationSettings(): IntegrationSettings {
  return {
    email: { enabled: true, requirement: FIELD_REQUIREMENT.Required },
    telegram: { enabled: false, requirement: FIELD_REQUIREMENT.Optional },
    slack: { enabled: false, requirement: FIELD_REQUIREMENT.Optional },
    evm: { enabled: true, requirement: FIELD_REQUIREMENT.Required },
    solana: { enabled: false, requirement: FIELD_REQUIREMENT.Optional },
    near: { enabled: false, requirement: FIELD_REQUIREMENT.Optional },
    tron: { enabled: false, requirement: FIELD_REQUIREMENT.Optional },
  };
}

function cloneSettings(settings: IntegrationSettings): IntegrationSettings {
  return {
    email: { ...settings.email },
    telegram: { ...settings.telegram },
    slack: { ...settings.slack },
    evm: { ...settings.evm },
    solana: { ...settings.solana },
    near: { ...settings.near },
    tron: { ...settings.tron },
  };
}

let settings = defaultIntegrationSettings();

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function getIntegrationSettings(): Promise<IntegrationSettings> {
  await delay(200);
  return cloneSettings(settings);
}

export function readIntegrationSettings(): IntegrationSettings {
  return cloneSettings(settings);
}

export async function updateIntegrationField(
  key: IntegrationFieldKey,
  patch: Partial<ChannelConfig>,
): Promise<IntegrationSettings> {
  await delay(150);
  if (key === INTEGRATION_FIELD.Evm) {
    return cloneSettings(settings);
  }
  settings = {
    ...settings,
    [key]: {
      ...settings[key],
      ...patch,
    },
  };
  return cloneSettings(settings);
}
