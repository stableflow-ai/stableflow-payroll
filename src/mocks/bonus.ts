import type {
  BonusChartRange,
  BonusMockVariant,
  BonusPayoutStatus,
} from "@/views/bonus/config";
import {
  BONUS_CHART_RANGE,
  BONUS_MOCK_VARIANT,
  BONUS_PAYOUT_STATUS,
} from "@/views/bonus/config";

export type BonusChartPoint = {
  label: string;
  value: number;
  highlighted?: boolean;
};

export type BonusRecentPayout = {
  id: string;
  amount: string;
  token: string;
  network: string;
  recipient: string;
  status: BonusPayoutStatus;
};

export type BonusPendingRow = {
  id: string;
  name: string;
  address: string;
  token: string;
  network: string;
  amount: string;
};

export type BonusPendingList = {
  totalPayout: string;
  members: number;
  payDate: string;
  rows: BonusPendingRow[];
};

export type BonusHistoryItem = {
  id: string;
  title: string;
  totalPayout: string;
  memberCount: number;
  executedAt: string;
};

export type BonusOverview = {
  totalBonus: string;
  totalChangePercent: number | null;
  members: number;
  membersChangePercent: number | null;
  chartRange: BonusChartRange;
  chartPeriodLabel: string;
  chartCurrentValue: string;
  chartPoints: BonusChartPoint[];
  recentPayouts: BonusRecentPayout[];
  failedRecentCount: number;
  pending: BonusPendingList | null;
  history: BonusHistoryItem[];
};

const EMPTY_CHART_POINTS: BonusChartPoint[] = [
  { label: "Mar", value: 0 },
  { label: "Apr", value: 0 },
  { label: "May", value: 0 },
  { label: "Jun", value: 0 },
  { label: "Jul", value: 0, highlighted: true },
  { label: "Aug", value: 0 },
];

const FILLED_CHART_POINTS: BonusChartPoint[] = [
  { label: "Mar", value: 120 },
  { label: "Apr", value: 280 },
  { label: "May", value: 360 },
  { label: "Jun", value: 420 },
  { label: "Jul", value: 540, highlighted: true },
  { label: "Aug", value: 480 },
];

const PENDING_ROW_NAMES = ["Andrew", "Hannah Petty", "Albert", "Zoey"] as const;
const PENDING_ROW_AMOUNTS = ["500", "300", "500", "800"] as const;
const PENDING_RECIPIENT_ADDRESS = "0x253a1b2c3d4e5f678901234567890abcdefef602";
const RECENT_RECIPIENT_ADDRESS = "0x541a1b2c3d4e5f678901234567890abcdef58dc1";

function filledPendingRows(): BonusPendingRow[] {
  return Array.from({ length: 8 }, (_, index) => {
    const cycle = index % PENDING_ROW_NAMES.length;
    return {
      id: `bonus-member-${index + 1}`,
      name: PENDING_ROW_NAMES[cycle],
      address: PENDING_RECIPIENT_ADDRESS,
      token: "USDC",
      network: "near",
      amount: PENDING_ROW_AMOUNTS[cycle],
    };
  });
}

function getBonusOverviewEmptyMock(): BonusOverview {
  return {
    totalBonus: "0",
    totalChangePercent: null,
    members: 0,
    membersChangePercent: null,
    chartRange: BONUS_CHART_RANGE.Months6,
    chartPeriodLabel: "August, 2026",
    chartCurrentValue: "0",
    chartPoints: EMPTY_CHART_POINTS,
    recentPayouts: [],
    failedRecentCount: 0,
    pending: null,
    history: [],
  };
}

function getBonusOverviewFilledMock(): BonusOverview {
  return {
    totalBonus: "4800",
    totalChangePercent: 12,
    members: 8,
    membersChangePercent: 4,
    chartRange: BONUS_CHART_RANGE.Months6,
    chartPeriodLabel: "July, 2026",
    chartCurrentValue: "540",
    chartPoints: FILLED_CHART_POINTS,
    recentPayouts: [
      {
        id: "bonus-payout-1",
        amount: "500",
        token: "USDT",
        network: "base",
        recipient: RECENT_RECIPIENT_ADDRESS,
        status: BONUS_PAYOUT_STATUS.Pending,
      },
      {
        id: "bonus-payout-2",
        amount: "800",
        token: "USDC",
        network: "arb",
        recipient: RECENT_RECIPIENT_ADDRESS,
        status: BONUS_PAYOUT_STATUS.Pending,
      },
      {
        id: "bonus-payout-3",
        amount: "300",
        token: "USDC",
        network: "arb",
        recipient: RECENT_RECIPIENT_ADDRESS,
        status: BONUS_PAYOUT_STATUS.Failed,
      },
      {
        id: "bonus-payout-4",
        amount: "500",
        token: "USDC",
        network: "near",
        recipient: RECENT_RECIPIENT_ADDRESS,
        status: BONUS_PAYOUT_STATUS.Paid,
      },
      {
        id: "bonus-payout-5",
        amount: "800",
        token: "USDC",
        network: "sol",
        recipient: RECENT_RECIPIENT_ADDRESS,
        status: BONUS_PAYOUT_STATUS.Paid,
      },
      {
        id: "bonus-payout-6",
        amount: "300",
        token: "USDT",
        network: "base",
        recipient: RECENT_RECIPIENT_ADDRESS,
        status: BONUS_PAYOUT_STATUS.Paid,
      },
    ],
    failedRecentCount: 1,
    pending: {
      totalPayout: "4200",
      members: 8,
      payDate: "Oct. 1, 2026",
      rows: filledPendingRows(),
    },
    history: [
      {
        id: "history-august",
        title: "August Bonus",
        totalPayout: "4800",
        memberCount: 8,
        executedAt: "2026-09-01",
      },
      {
        id: "history-july",
        title: "July Bonus",
        totalPayout: "5400",
        memberCount: 8,
        executedAt: "2026-08-01",
      },
      {
        id: "history-june",
        title: "June Bonus",
        totalPayout: "4200",
        memberCount: 6,
        executedAt: "2026-07-01",
      },
      {
        id: "history-may",
        title: "May Bonus",
        totalPayout: "3600",
        memberCount: 6,
        executedAt: "2026-06-01",
      },
    ],
  };
}

export function getBonusOverviewMock(
  variant: BonusMockVariant = BONUS_MOCK_VARIANT.Empty,
): BonusOverview {
  return variant === BONUS_MOCK_VARIANT.Filled
    ? getBonusOverviewFilledMock()
    : getBonusOverviewEmptyMock();
}
