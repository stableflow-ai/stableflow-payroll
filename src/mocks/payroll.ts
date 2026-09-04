import type {
  PayrollChartRange,
  PayrollMockVariant,
  PayrollPayoutStatus,
  PayrollRunStatus,
} from "@/views/payroll/config";
import {
  PAYROLL_CHART_RANGE,
  PAYROLL_MOCK_VARIANT,
  PAYROLL_PAYOUT_STATUS,
  PAYROLL_RUN_STATUS,
} from "@/views/payroll/config";

export type PayrollChartPoint = {
  label: string;
  value: number;
  highlighted?: boolean;
};

export type PayrollRecentPayout = {
  id: string;
  amount: string;
  token: string;
  network: string;
  recipient: string;
  status: PayrollPayoutStatus;
};

export type PayrollRecipientRow = {
  id: string;
  name: string;
  address: string;
  token: string;
  network: string;
  amount: string;
  netPay: string;
};

export type PayrollNextRun = {
  totalPayout: string;
  recipients: number;
  payDate: string;
  rows: PayrollRecipientRow[];
};

export type PayrollHistoryRun = {
  id: string;
  title: string;
  status: PayrollRunStatus;
  paidCount: number;
  recipientCount: number;
  totalPayout: string;
  transactionCount: number;
  failedCount: number;
  executedAt: string;
};

export type PayrollOverview = {
  totalThisMonth: string;
  totalChangePercent: number | null;
  recipients: number;
  recipientsChangePercent: number | null;
  averageSalary: string;
  maximumSalary: string;
  chartRange: PayrollChartRange;
  chartPeriodLabel: string;
  chartCurrentValue: string;
  chartPoints: PayrollChartPoint[];
  recentPayouts: PayrollRecentPayout[];
  failedRecentCount: number;
  nextPayroll: PayrollNextRun | null;
  history: PayrollHistoryRun[];
};

const EMPTY_CHART_POINTS: PayrollChartPoint[] = [
  { label: "Mar", value: 0 },
  { label: "Apr", value: 0 },
  { label: "May", value: 0 },
  { label: "Jun", value: 0 },
  { label: "Jul", value: 0 },
  { label: "Aug", value: 0 },
];

const FILLED_CHART_POINTS: PayrollChartPoint[] = [
  { label: "Mar", value: 8_000 },
  { label: "Apr", value: 16_000 },
  { label: "May", value: 22_000 },
  { label: "Jun", value: 28_000 },
  { label: "Jul", value: 35_500, highlighted: true },
  { label: "Aug", value: 32_000 },
];

const NEXT_ROW_NAMES = ["Andrew", "Hannah Petty", "Albert", "Zoey"] as const;
const NEXT_ROW_AMOUNTS = ["5000", "3000", "5000", "8000"] as const;
const NEXT_RECIPIENT_ADDRESS = "0x253a1b2c3d4e5f678901234567890abcdefef602";
const RECENT_RECIPIENT_ADDRESS = "0x541a1b2c3d4e5f678901234567890abcdef58dc1";

function filledNextRows(): PayrollRecipientRow[] {
  return Array.from({ length: 12 }, (_, index) => {
    const cycle = index % NEXT_ROW_NAMES.length;
    return {
      id: `recipient-${index + 1}`,
      name: NEXT_ROW_NAMES[cycle],
      address: NEXT_RECIPIENT_ADDRESS,
      token: "USDC",
      network: "near",
      amount: NEXT_ROW_AMOUNTS[cycle],
      netPay: NEXT_ROW_AMOUNTS[cycle],
    };
  });
}

function getPayrollOverviewEmptyMock(): PayrollOverview {
  return {
    totalThisMonth: "0",
    totalChangePercent: null,
    recipients: 0,
    recipientsChangePercent: null,
    averageSalary: "0",
    maximumSalary: "0",
    chartRange: PAYROLL_CHART_RANGE.Months6,
    chartPeriodLabel: "August, 2026",
    chartCurrentValue: "0",
    chartPoints: EMPTY_CHART_POINTS,
    recentPayouts: [],
    failedRecentCount: 0,
    nextPayroll: null,
    history: [],
  };
}

function getPayrollOverviewFilledMock(): PayrollOverview {
  return {
    totalThisMonth: "36000",
    totalChangePercent: 8,
    recipients: 12,
    recipientsChangePercent: 0,
    averageSalary: "3220",
    maximumSalary: "8500",
    chartRange: PAYROLL_CHART_RANGE.Months6,
    chartPeriodLabel: "July, 2026",
    chartCurrentValue: "35500",
    chartPoints: FILLED_CHART_POINTS,
    recentPayouts: [
      {
        id: "payout-1",
        amount: "1000",
        token: "USDT",
        network: "base",
        recipient: RECENT_RECIPIENT_ADDRESS,
        status: PAYROLL_PAYOUT_STATUS.Pending,
      },
      {
        id: "payout-2",
        amount: "2000",
        token: "USDC",
        network: "arb",
        recipient: RECENT_RECIPIENT_ADDRESS,
        status: PAYROLL_PAYOUT_STATUS.Pending,
      },
      {
        id: "payout-3",
        amount: "2000",
        token: "USDC",
        network: "arb",
        recipient: RECENT_RECIPIENT_ADDRESS,
        status: PAYROLL_PAYOUT_STATUS.Failed,
      },
      {
        id: "payout-4",
        amount: "2000",
        token: "USDC",
        network: "arb",
        recipient: RECENT_RECIPIENT_ADDRESS,
        status: PAYROLL_PAYOUT_STATUS.Paid,
      },
      {
        id: "payout-5",
        amount: "2000",
        token: "USDC",
        network: "arb",
        recipient: RECENT_RECIPIENT_ADDRESS,
        status: PAYROLL_PAYOUT_STATUS.Paid,
      },
      {
        id: "payout-6",
        amount: "2000",
        token: "USDC",
        network: "arb",
        recipient: RECENT_RECIPIENT_ADDRESS,
        status: PAYROLL_PAYOUT_STATUS.Paid,
      },
    ],
    failedRecentCount: 1,
    nextPayroll: {
      totalPayout: "273500",
      recipients: 12,
      payDate: "Oct. 1, 2026",
      rows: filledNextRows(),
    },
    history: [
      {
        id: "history-august",
        title: "August Payroll",
        status: PAYROLL_RUN_STATUS.Pending,
        paidCount: 2,
        recipientCount: 12,
        totalPayout: "35000",
        transactionCount: 2,
        failedCount: 0,
        executedAt: "2026-09-01",
      },
      {
        id: "history-july",
        title: "July Payroll",
        status: PAYROLL_RUN_STATUS.Failed,
        paidCount: 11,
        recipientCount: 12,
        totalPayout: "35000",
        transactionCount: 11,
        failedCount: 1,
        executedAt: "2026-08-01",
      },
      {
        id: "history-june",
        title: "June Payroll",
        status: PAYROLL_RUN_STATUS.Paid,
        paidCount: 12,
        recipientCount: 12,
        totalPayout: "35000",
        transactionCount: 11,
        failedCount: 0,
        executedAt: "2026-07-01",
      },
      {
        id: "history-may",
        title: "May Payroll",
        status: PAYROLL_RUN_STATUS.Paid,
        paidCount: 12,
        recipientCount: 12,
        totalPayout: "35000",
        transactionCount: 11,
        failedCount: 0,
        executedAt: "2026-06-01",
      },
    ],
  };
}

export function getPayrollOverviewMock(
  variant: PayrollMockVariant = PAYROLL_MOCK_VARIANT.Empty,
): PayrollOverview {
  return variant === PAYROLL_MOCK_VARIANT.Filled
    ? getPayrollOverviewFilledMock()
    : getPayrollOverviewEmptyMock();
}
