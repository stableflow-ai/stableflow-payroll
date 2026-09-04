import type {
  BonusChartRange,
  BonusMockVariant,
  BonusPayoutStatus,
  BonusRowAction,
} from "@/views/bonus/config";
import {
  BONUS_CHART_RANGE,
  BONUS_MOCK_VARIANT,
  BONUS_PAYOUT_STATUS,
  BONUS_ROW_ACTION,
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

export type BonusPendingMember = {
  id: string;
  name: string;
  address: string;
  amount: string;
  token: string;
};

export type BonusPendingItem = {
  id: string;
  title: string;
  amount: string;
  token: string;
  action: BonusRowAction;
  members: BonusPendingMember[];
};

export type BonusPendingList = {
  totalAmount: string;
  token: string;
  /** Top-level pending bonus entries (not expanded member count). */
  entryCount: number;
  items: BonusPendingItem[];
};

/** Flat row used when seeding the Add/Edit drawer from a single-member item. */
export type BonusPendingRow = {
  id: string;
  name: string;
  address: string;
  token: string;
  network: string;
  amount: string;
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
  totalBonusToken: string;
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
  { label: "Jul", value: 0 },
  { label: "Aug", value: 0 },
];

const FILLED_CHART_POINTS: BonusChartPoint[] = [
  { label: "Mar", value: 0 },
  { label: "Apr", value: 0 },
  { label: "May", value: 0 },
  { label: "Jun", value: 0 },
  { label: "Jul", value: 0 },
  { label: "Aug", value: 600, highlighted: true },
];

const MEMBER_ADDRESS = "0x253a1b2c3d4e5f678901234567890abcdefef602";
const RECENT_RECIPIENT_ADDRESS = "0x541a1b2c3d4e5f678901234567890abcdef58dc1";

function getBonusOverviewEmptyMock(): BonusOverview {
  return {
    totalBonus: "0",
    totalBonusToken: "",
    totalChangePercent: null,
    members: 0,
    membersChangePercent: null,
    chartRange: BONUS_CHART_RANGE.Months6,
    chartPeriodLabel: "August, 2026",
    chartCurrentValue: "$0",
    chartPoints: EMPTY_CHART_POINTS,
    recentPayouts: [],
    failedRecentCount: 0,
    pending: null,
    history: [],
  };
}

function getBonusOverviewFilledMock(): BonusOverview {
  return {
    totalBonus: "600",
    totalBonusToken: "Near",
    totalChangePercent: 10,
    members: 9,
    membersChangePercent: 20,
    chartRange: BONUS_CHART_RANGE.Months6,
    chartPeriodLabel: "August, 2026",
    chartCurrentValue: "Near",
    chartPoints: FILLED_CHART_POINTS,
    recentPayouts: [
      {
        id: "bonus-payout-1",
        amount: "200",
        token: "Near",
        network: "near",
        recipient: RECENT_RECIPIENT_ADDRESS,
        status: BONUS_PAYOUT_STATUS.Pending,
      },
    ],
    failedRecentCount: 0,
    pending: {
      totalAmount: "600",
      token: "Near",
      entryCount: 3,
      items: [
        {
          id: "bonus-andrew",
          title: "Andrew",
          amount: "200",
          token: "Near",
          action: BONUS_ROW_ACTION.Paying,
          members: [
            {
              id: "bonus-andrew-m1",
              name: "Andrew",
              address: MEMBER_ADDRESS,
              amount: "200",
              token: "Near",
            },
          ],
        },
        {
          id: "bonus-team-a",
          title: "Project Bonus - Team A",
          amount: "800",
          token: "Near",
          action: BONUS_ROW_ACTION.PayNow,
          members: [
            {
              id: "bonus-team-a-1",
              name: "Alice",
              address: MEMBER_ADDRESS,
              amount: "200",
              token: "Near",
            },
            {
              id: "bonus-team-a-2",
              name: "Bill",
              address: MEMBER_ADDRESS,
              amount: "200",
              token: "Near",
            },
            {
              id: "bonus-team-a-3",
              name: "Carol",
              address: MEMBER_ADDRESS,
              amount: "200",
              token: "Near",
            },
            {
              id: "bonus-team-a-4",
              name: "Dave",
              address: MEMBER_ADDRESS,
              amount: "200",
              token: "Near",
            },
          ],
        },
        {
          id: "bonus-team-b",
          title: "Project Bonus - Team B",
          amount: "600",
          token: "Near",
          action: BONUS_ROW_ACTION.PayNow,
          members: [
            {
              id: "bonus-team-b-1",
              name: "Alice",
              address: MEMBER_ADDRESS,
              amount: "200",
              token: "Near",
            },
            {
              id: "bonus-team-b-2",
              name: "Bill",
              address: MEMBER_ADDRESS,
              amount: "200",
              token: "Near",
            },
            {
              id: "bonus-team-b-3",
              name: "Andrew",
              address: MEMBER_ADDRESS,
              amount: "200",
              token: "Near",
            },
          ],
        },
      ],
    },
    history: [
      {
        id: "history-august",
        title: "August Bonus",
        totalPayout: "600",
        memberCount: 9,
        executedAt: "2026-09-01",
      },
      {
        id: "history-july",
        title: "July Bonus",
        totalPayout: "540",
        memberCount: 8,
        executedAt: "2026-08-01",
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
