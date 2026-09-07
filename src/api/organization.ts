import { PAY_API_PREFIX } from "@/api/config";
import { apiNumber, apiText, asRecord } from "@/api/map";
import { ApiError } from "@/lib/api-error";
import { http } from "@/lib/http";
import type { VolumePeriod } from "@/types/payout";
import {
  FIELD_REQUIREMENT,
  ORGANIZATION_FIELD_STATUS,
  ORGANIZATION_HIGH_PRIORITY_CATEGORY,
  defaultAddressSettings,
  defaultNotificationSettings,
  type ChannelConfig,
  type IntegrationSettings,
  type OrganizationAddressSettings,
  type OrganizationFieldStatus,
  type OrganizationHighPriorityCategory,
  type OrganizationHighPriorityItem,
  type OrganizationItem,
  type OrganizationNotificationSettings,
  type OrganizationOverview,
  type OrganizationPayoutPoint,
  type OrganizationPublicInfo,
  type UpdateOrganizationBody,
} from "@/types/organization";

const HIGH_PRIORITY_CATEGORIES = new Set<string>(
  Object.values(ORGANIZATION_HIGH_PRIORITY_CATEGORY),
);

const FIELD_STATUSES = new Set<string>(Object.values(ORGANIZATION_FIELD_STATUS));

export function mapOrganizationOverview(raw: unknown): OrganizationOverview {
  const row = asRecord(raw) ?? {};
  return {
    teamMembers: apiNumber(row.team_members ?? row.teamMembers) ?? 0,
    totalPayments: apiNumber(row.total_payments ?? row.totalPayments) ?? 0,
    totalPayout: apiText(row.total_payout ?? row.totalPayout),
  };
}

function mapPayoutPoint(raw: unknown): OrganizationPayoutPoint | null {
  const row = asRecord(raw);
  if (!row) return null;
  const label = apiText(row.time).trim();
  if (!label) return null;
  return {
    label,
    volume: apiNumber(row.total_payout ?? row.totalPayout) ?? 0,
    transaction: apiNumber(row.total_payments ?? row.totalPayments) ?? 0,
  };
}

export function mapOrganizationPayoutPoints(raw: unknown): OrganizationPayoutPoint[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((row) => {
    const point = mapPayoutPoint(row);
    return point ? [point] : [];
  });
}

function mapHighPriorityItem(raw: unknown): OrganizationHighPriorityItem | null {
  const row = asRecord(raw);
  if (!row) return null;
  const category = apiText(row.category).trim();
  if (!HIGH_PRIORITY_CATEGORIES.has(category)) return null;
  return {
    category: category as OrganizationHighPriorityCategory,
    count: apiNumber(row.count) ?? 0,
    month: apiText(row.month).trim(),
  };
}

export function mapOrganizationHighPriorityItems(raw: unknown): OrganizationHighPriorityItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((row) => {
    const item = mapHighPriorityItem(row);
    return item ? [item] : [];
  });
}

export function mapOrganizationFieldStatus(value: unknown): OrganizationFieldStatus {
  const text = apiText(value).trim();
  if (FIELD_STATUSES.has(text)) return text as OrganizationFieldStatus;
  return ORGANIZATION_FIELD_STATUS.Disabled;
}

export function mapAddressSettings(raw: unknown): OrganizationAddressSettings {
  const row = asRecord(raw);
  if (!row) return defaultAddressSettings();
  return {
    evmAddress: mapOrganizationFieldStatus(row.evm_address ?? row.evmAddress),
    nearAddress: mapOrganizationFieldStatus(row.near_address ?? row.nearAddress),
    solanaAddress: mapOrganizationFieldStatus(row.solana_address ?? row.solanaAddress),
    tronAddress: mapOrganizationFieldStatus(row.tron_address ?? row.tronAddress),
  };
}

export function mapNotificationSettings(raw: unknown): OrganizationNotificationSettings {
  const row = asRecord(raw);
  if (!row) return defaultNotificationSettings();
  return {
    email: mapOrganizationFieldStatus(row.email),
    telegram: mapOrganizationFieldStatus(row.telegram),
    slack: mapOrganizationFieldStatus(row.slack),
  };
}

export function channelConfigFromStatus(status: OrganizationFieldStatus): ChannelConfig {
  if (status === ORGANIZATION_FIELD_STATUS.Required) {
    return { enabled: true, requirement: FIELD_REQUIREMENT.Required };
  }
  if (status === ORGANIZATION_FIELD_STATUS.Optional) {
    return { enabled: true, requirement: FIELD_REQUIREMENT.Optional };
  }
  return { enabled: false, requirement: FIELD_REQUIREMENT.Optional };
}

export function statusFromChannelConfig(config: ChannelConfig): OrganizationFieldStatus {
  if (!config.enabled) return ORGANIZATION_FIELD_STATUS.Disabled;
  return config.requirement === FIELD_REQUIREMENT.Required
    ? ORGANIZATION_FIELD_STATUS.Required
    : ORGANIZATION_FIELD_STATUS.Optional;
}

export function integrationSettingsFromOrganization(org: {
  addressSettings: OrganizationAddressSettings;
  notificationSettings: OrganizationNotificationSettings;
}): IntegrationSettings {
  return {
    email: channelConfigFromStatus(org.notificationSettings.email),
    telegram: channelConfigFromStatus(org.notificationSettings.telegram),
    slack: channelConfigFromStatus(org.notificationSettings.slack),
    evm: channelConfigFromStatus(org.addressSettings.evmAddress),
    solana: channelConfigFromStatus(org.addressSettings.solanaAddress),
    near: channelConfigFromStatus(org.addressSettings.nearAddress),
    tron: channelConfigFromStatus(org.addressSettings.tronAddress),
  };
}

export function organizationSettingsFromIntegration(
  settings: IntegrationSettings,
  evmAddress: OrganizationFieldStatus,
): Pick<OrganizationItem, "addressSettings" | "notificationSettings"> {
  return {
    addressSettings: {
      evmAddress,
      nearAddress: statusFromChannelConfig(settings.near),
      solanaAddress: statusFromChannelConfig(settings.solana),
      tronAddress: statusFromChannelConfig(settings.tron),
    },
    notificationSettings: {
      email: statusFromChannelConfig(settings.email),
      telegram: statusFromChannelConfig(settings.telegram),
      slack: statusFromChannelConfig(settings.slack),
    },
  };
}

function mapOrganizationItem(raw: unknown): OrganizationItem | null {
  const row = asRecord(raw);
  if (!row) return null;
  const id = apiNumber(row.id);
  const name = apiText(row.name).trim();
  if (id === null || !name) return null;
  const logo = apiText(row.logo).trim();
  return {
    id,
    name,
    ...(logo ? { logo } : {}),
    orgId: apiText(row.org_id ?? row.orgId),
    role: apiText(row.role),
    addressSettings: mapAddressSettings(row.address_settings ?? row.addressSettings),
    notificationSettings: mapNotificationSettings(
      row.notification_settings ?? row.notificationSettings,
    ),
  };
}

export function mapOrganizationList(raw: unknown): OrganizationItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((row) => {
    const item = mapOrganizationItem(row);
    return item ? [item] : [];
  });
}

export function mapOrganizationPublicInfo(raw: unknown): OrganizationPublicInfo {
  const row = asRecord(raw) ?? {};
  const name = apiText(row.name).trim();
  if (!name) {
    throw new ApiError("Organization is missing", 502, "INVALID_ORGANIZATION");
  }
  const logo = apiText(row.logo).trim();
  return {
    name,
    ...(logo ? { logo } : {}),
    addressSettings: mapAddressSettings(row.address_settings ?? row.addressSettings),
    notificationSettings: mapNotificationSettings(
      row.notification_settings ?? row.notificationSettings,
    ),
  };
}

export function pickOrganization(
  items: OrganizationItem[],
  id: number,
): OrganizationItem | null {
  return items.find((item) => item.id === id) ?? items[0] ?? null;
}

function updateOrganizationRequestBody(body: UpdateOrganizationBody) {
  const logo = body.logo?.trim();
  return {
    name: body.name,
    ...(logo ? { logo } : {}),
    address_settings: {
      evm_address: body.addressSettings.evmAddress,
      near_address: body.addressSettings.nearAddress,
      solana_address: body.addressSettings.solanaAddress,
      tron_address: body.addressSettings.tronAddress,
    },
    notification_settings: {
      email: body.notificationSettings.email,
      telegram: body.notificationSettings.telegram,
      slack: body.notificationSettings.slack,
    },
  };
}

export async function getOrganizationOverview(organizationId: number) {
  return mapOrganizationOverview(
    await http<unknown>(`${PAY_API_PREFIX}/organizations/overview`, {
      query: { organization_id: organizationId },
    }),
  );
}

export async function getOrganizationPayout(params: {
  organizationId: number;
  period: VolumePeriod;
  timezone: string;
}) {
  return mapOrganizationPayoutPoints(
    await http<unknown>(`${PAY_API_PREFIX}/organizations/payout`, {
      query: {
        organization_id: params.organizationId,
        period: params.period,
        timezone: params.timezone,
      },
    }),
  );
}

export async function getOrganizationHighPriority(params: {
  organizationId: number;
  timezone: string;
}) {
  return mapOrganizationHighPriorityItems(
    await http<unknown>(`${PAY_API_PREFIX}/organizations/high-priority`, {
      query: {
        organization_id: params.organizationId,
        timezone: params.timezone,
      },
    }),
  );
}

export async function getOrganization(id: number) {
  return mapOrganizationList(
    await http<unknown>(`${PAY_API_PREFIX}/organizations/${id}`),
  );
}

export async function getOrganizationInfo(orgId: string) {
  return mapOrganizationPublicInfo(
    await http<unknown>(
      `${PAY_API_PREFIX}/organizations/info/${encodeURIComponent(orgId)}`,
      { auth: false },
    ),
  );
}

export async function updateOrganization(id: number, body: UpdateOrganizationBody) {
  await http<void>(`${PAY_API_PREFIX}/organizations/${id}`, {
    method: "POST",
    body: updateOrganizationRequestBody(body),
  });
}
