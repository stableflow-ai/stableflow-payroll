import { VOLUME_PERIOD, type VolumePeriod } from "@/types/payout";

export const ADMIN_HIGH_PRIORITY_KIND = {
  Payroll: "payroll",
  PaymentRequest: "payment-request",
  Failed: "failed",
} as const;

export type AdminHighPriorityKind =
  (typeof ADMIN_HIGH_PRIORITY_KIND)[keyof typeof ADMIN_HIGH_PRIORITY_KIND];

export type AdminOverviewChartPoint = {
  label: string;
  volume: number;
  transaction: number;
};

export type AdminHighPriorityItem = {
  id: string;
  kind: AdminHighPriorityKind;
  title: string;
  subtitle: string;
  to: string;
};

export type AdminOverview = {
  teamMemberCount: number;
  totalPayment: string;
  paymentCount: number;
  volume: Partial<Record<VolumePeriod, AdminOverviewChartPoint[]>>;
  highPriority: AdminHighPriorityItem[];
};

const OVERVIEW: AdminOverview = {
  teamMemberCount: 8,
  totalPayment: "36520",
  paymentCount: 146,
  volume: {
    [VOLUME_PERIOD.Daily]: [
      { label: "Aug 1", volume: 42000, transaction: 8 },
      { label: "Aug 3", volume: 51000, transaction: 11 },
      { label: "Aug 6", volume: 38000, transaction: 7 },
      { label: "Aug 9", volume: 72000, transaction: 16 },
      { label: "Aug 12", volume: 61000, transaction: 13 },
      { label: "Aug 15", volume: 88000, transaction: 21 },
      { label: "Aug 18", volume: 54000, transaction: 12 },
      { label: "Aug 21", volume: 47000, transaction: 9 },
      { label: "Aug 24", volume: 69000, transaction: 15 },
      { label: "Aug 27", volume: 58000, transaction: 14 },
    ],
    [VOLUME_PERIOD.Weekly]: [
      { label: "Jul 6", volume: 98000, transaction: 22 },
      { label: "Jul 13", volume: 112000, transaction: 28 },
      { label: "Jul 20", volume: 86000, transaction: 19 },
      { label: "Jul 27", volume: 124000, transaction: 31 },
      { label: "Aug 3", volume: 141000, transaction: 34 },
      { label: "Aug 10", volume: 127000, transaction: 29 },
    ],
    [VOLUME_PERIOD.Monthly]: [
      { label: "Mar", volume: 42000, transaction: 18 },
      { label: "Apr", volume: 68000, transaction: 24 },
      { label: "May", volume: 91000, transaction: 31 },
      { label: "Jun", volume: 74000, transaction: 26 },
      { label: "Jul", volume: 118000, transaction: 38 },
      { label: "Aug", volume: 146000, transaction: 42 },
    ],
  },
  highPriority: [
    {
      id: "hp-payroll",
      kind: ADMIN_HIGH_PRIORITY_KIND.Payroll,
      title: "September payroll",
      subtitle: "Paydate 2026-09-01 (3 days left)",
      to: "/pay/payroll",
    },
    {
      id: "hp-requests",
      kind: ADMIN_HIGH_PRIORITY_KIND.PaymentRequest,
      title: "2 Payment Requests",
      subtitle: "Andrew and Blacke Morris",
      to: "/pay/expense",
    },
    {
      id: "hp-failed",
      kind: ADMIN_HIGH_PRIORITY_KIND.Failed,
      title: "Transaction Failed",
      subtitle: "August payroll has 2 failed transactions",
      to: "/pay/history",
    },
  ],
};

export function getAdminOverview(): Promise<AdminOverview> {
  return Promise.resolve(OVERVIEW);
}
