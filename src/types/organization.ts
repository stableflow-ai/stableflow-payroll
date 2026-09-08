export const ORGANIZATION_HIGH_PRIORITY_CATEGORY = {
  Payroll: "payroll",
  PayFailed: "payFailed",
  PaymentRequest: "requests",
} as const;

export type OrganizationHighPriorityCategory =
  (typeof ORGANIZATION_HIGH_PRIORITY_CATEGORY)[keyof typeof ORGANIZATION_HIGH_PRIORITY_CATEGORY];

export const ORGANIZATION_FIELD_STATUS = {
  Disabled: "disabled",
  Optional: "optional",
  Required: "required",
} as const;

export type OrganizationFieldStatus =
  (typeof ORGANIZATION_FIELD_STATUS)[keyof typeof ORGANIZATION_FIELD_STATUS];

export const FIELD_REQUIREMENT = {
  Required: "required",
  Optional: "optional",
} as const;

export type FieldRequirement = (typeof FIELD_REQUIREMENT)[keyof typeof FIELD_REQUIREMENT];

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

export type ChannelConfig = {
  enabled: boolean;
  requirement: FieldRequirement;
};

export type IntegrationSettings = Record<IntegrationFieldKey, ChannelConfig>;

export interface OrganizationOverview {
  teamMembers: number;
  totalPayments: number;
  totalPayout: string;
}

export interface OrganizationPayoutPoint {
  label: string;
  volume: number;
  transaction: number;
}

export interface OrganizationHighPriorityItem {
  category: OrganizationHighPriorityCategory;
  title: string;
  description: string;
}

export interface OrganizationAddressSettings {
  evmAddress: OrganizationFieldStatus;
  nearAddress: OrganizationFieldStatus;
  solanaAddress: OrganizationFieldStatus;
  tronAddress: OrganizationFieldStatus;
}

export interface OrganizationNotificationSettings {
  email: OrganizationFieldStatus;
  telegram: OrganizationFieldStatus;
  slack: OrganizationFieldStatus;
}

export interface OrganizationItem {
  id: number;
  name: string;
  logo?: string;
  orgId: string;
  role: string;
  addressSettings: OrganizationAddressSettings;
  notificationSettings: OrganizationNotificationSettings;
}

export interface OrganizationPublicInfo {
  name: string;
  logo?: string;
  addressSettings: OrganizationAddressSettings;
  notificationSettings: OrganizationNotificationSettings;
}

export interface UpdateOrganizationBody {
  name: string;
  logo?: string;
}

export type UpdateAddressSettingsBody = Partial<
  Pick<OrganizationAddressSettings, "nearAddress" | "solanaAddress" | "tronAddress">
>;

export type UpdateNotificationSettingsBody = Partial<
  Pick<OrganizationNotificationSettings, "telegram" | "slack">
>;

export interface SlackOAuthBody {
  code: string;
  state: string;
}

export interface SlackConnectResult {
  authorizationUrl: string;
}

export interface SlackOAuthResult {
  slackTeamId: string;
  slackTeamName: string;
}

export function defaultAddressSettings(): OrganizationAddressSettings {
  return {
    evmAddress: ORGANIZATION_FIELD_STATUS.Required,
    nearAddress: ORGANIZATION_FIELD_STATUS.Disabled,
    solanaAddress: ORGANIZATION_FIELD_STATUS.Disabled,
    tronAddress: ORGANIZATION_FIELD_STATUS.Disabled,
  };
}

export function defaultNotificationSettings(): OrganizationNotificationSettings {
  return {
    email: ORGANIZATION_FIELD_STATUS.Required,
    telegram: ORGANIZATION_FIELD_STATUS.Disabled,
    slack: ORGANIZATION_FIELD_STATUS.Disabled,
  };
}

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
