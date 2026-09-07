import { PAY_API_PREFIX } from "@/api/config";
import { apiNumber, apiText, asRecord } from "@/api/map";
import { http } from "@/lib/http";
import type { VolumePeriod } from "@/types/payout";
import {
  ORGANIZATION_HIGH_PRIORITY_CATEGORY,
  type OrganizationHighPriorityCategory,
  type OrganizationHighPriorityItem,
  type OrganizationItem,
  type OrganizationOverview,
  type OrganizationPayoutPoint,
  type UpdateOrganizationBody,
} from "@/types/organization";

const HIGH_PRIORITY_CATEGORIES = new Set<string>(
  Object.values(ORGANIZATION_HIGH_PRIORITY_CATEGORY),
);

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
  };
}

export function mapOrganizationList(raw: unknown): OrganizationItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((row) => {
    const item = mapOrganizationItem(row);
    return item ? [item] : [];
  });
}

export function pickOrganization(
  items: OrganizationItem[],
  id: number,
): OrganizationItem | null {
  return items.find((item) => item.id === id) ?? items[0] ?? null;
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

export async function updateOrganization(id: number, body: UpdateOrganizationBody) {
  const logo = body.logo?.trim();
  await http<void>(`${PAY_API_PREFIX}/organizations/${id}`, {
    method: "POST",
    body: logo ? { name: body.name, logo } : { name: body.name },
  });
}
