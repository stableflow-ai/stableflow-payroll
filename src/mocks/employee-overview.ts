import { VOLUME_PERIOD, type VolumePeriod } from "@/types/payout";

export const EMPLOYEE_PAYMENT_TYPE = {
  Income: "income",
  Payout: "payout",
} as const;

export type EmployeePaymentType =
  (typeof EMPLOYEE_PAYMENT_TYPE)[keyof typeof EMPLOYEE_PAYMENT_TYPE];

export type EmployeeOverviewVolumePoint = {
  label: string;
  income: number;
  payout: number;
  incomeTx: number;
  payoutTx: number;
};

export type EmployeeOpenRequest = {
  id: string;
  name: string;
  createdAt: string;
  status: "pending";
};

export type EmployeeRecentPayment = {
  id: string;
  type: EmployeePaymentType;
  purpose: string;
  from: string;
  to: string;
  amount: string;
  token: string;
  network: string;
  time: string;
  status: string;
  explorerUrl: string | null;
};

export type EmployeeOverview = {
  totalIncome: string;
  incomeTxCount: number;
  totalPayout: string;
  payoutTxCount: number;
  volume: Partial<Record<VolumePeriod, EmployeeOverviewVolumePoint[]>>;
  openRequests: EmployeeOpenRequest[];
  recentPayments: EmployeeRecentPayment[];
};

const ADDR = {
  fromA: "0x253aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaef602",
  toA: "0xef3bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb2055",
  toB: "0x75accccccccccccccccccccccccccccb2032",
  nearFrom: "aabbcc.near",
  nearTo: "andrew.near",
} as const;

const OVERVIEW: EmployeeOverview = {
  totalIncome: "16530",
  incomeTxCount: 4,
  totalPayout: "1250.35",
  payoutTxCount: 3,
  volume: {
    [VOLUME_PERIOD.Monthly]: [
      { label: "Mar", income: 0, payout: 0, incomeTx: 0, payoutTx: 0 },
      { label: "Apr", income: 3700, payout: 80, incomeTx: 1, payoutTx: 1 },
      { label: "May", income: 4000, payout: 560, incomeTx: 1, payoutTx: 1 },
      { label: "Jun", income: 3700, payout: 0, incomeTx: 1, payoutTx: 0 },
      { label: "Jul", income: 4000, payout: 105.23, incomeTx: 1, payoutTx: 1 },
      { label: "Aug", income: 3700, payout: 0, incomeTx: 1, payoutTx: 0 },
    ],
    [VOLUME_PERIOD.Daily]: [],
    [VOLUME_PERIOD.Weekly]: [],
  },
  openRequests: [
    {
      id: "req-1",
      name: "Invoice-Adward-July",
      createdAt: "2026-08-01T11:56:00.000Z",
      status: "pending",
    },
    {
      id: "req-2",
      name: "Business Trip Invoice-Andrew-July",
      createdAt: "2026-08-01T11:56:00.000Z",
      status: "pending",
    },
  ],
  recentPayments: [
    {
      id: "pay-1",
      type: EMPLOYEE_PAYMENT_TYPE.Income,
      purpose: "Invoice-Andrew-June",
      from: ADDR.fromA,
      to: ADDR.toA,
      amount: "500",
      token: "USDT",
      network: "arb",
      time: "2026-09-01T11:56:00.000Z",
      status: "complete",
      explorerUrl: "https://arbiscan.io/tx/0x1",
    },
    {
      id: "pay-2",
      type: EMPLOYEE_PAYMENT_TYPE.Payout,
      purpose: "",
      from: ADDR.fromA,
      to: ADDR.toB,
      amount: "189.23",
      token: "USDT",
      network: "arb",
      time: "2026-09-01T11:56:00.000Z",
      status: "complete",
      explorerUrl: "https://arbiscan.io/tx/0x2",
    },
    {
      id: "pay-3",
      type: EMPLOYEE_PAYMENT_TYPE.Income,
      purpose: "August Payroll",
      from: ADDR.fromA,
      to: ADDR.toA,
      amount: "4000",
      token: "USDT",
      network: "arb",
      time: "2026-09-01T11:56:00.000Z",
      status: "complete",
      explorerUrl: "https://arbiscan.io/tx/0x3",
    },
    {
      id: "pay-4",
      type: EMPLOYEE_PAYMENT_TYPE.Income,
      purpose: "Project Bonus",
      from: ADDR.nearFrom,
      to: ADDR.nearTo,
      amount: "200",
      token: "USDC",
      network: "near",
      time: "2026-09-01T11:56:00.000Z",
      status: "complete",
      explorerUrl: "https://nearblocks.io/txns/hash4",
    },
  ],
};

export function getEmployeeOverview(): Promise<EmployeeOverview> {
  return Promise.resolve(OVERVIEW);
}
