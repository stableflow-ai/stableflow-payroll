export const ORGANIZATION_HIGH_PRIORITY_CATEGORY = {
  Payroll: "payroll",
  PayFailed: "payFailed",
  PaymentRequest: "paymentRequest",
} as const;

export type OrganizationHighPriorityCategory =
  (typeof ORGANIZATION_HIGH_PRIORITY_CATEGORY)[keyof typeof ORGANIZATION_HIGH_PRIORITY_CATEGORY];

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
  count: number;
  month: string;
}

export interface OrganizationItem {
  id: number;
  name: string;
  logo?: string;
  orgId: string;
  role: string;
}

export interface UpdateOrganizationBody {
  name: string;
  logo?: string;
}
