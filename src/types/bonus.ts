export const BONUS_TOTAL_PAYOUT_PERIOD = {
  Day: "day",
  Week: "week",
  Month: "month",
} as const;

export type BonusTotalPayoutPeriod =
  (typeof BONUS_TOTAL_PAYOUT_PERIOD)[keyof typeof BONUS_TOTAL_PAYOUT_PERIOD];

export interface BonusCurrentStats {
  totalBonus: string;
  totalChangePercent: number | null;
  members: number;
  membersChangePercent: number | null;
}

export interface BonusCurrentStatsQuery {
  organizationId: number;
  timezone: string;
}

export interface BonusTotalPayoutPoint {
  time: string;
  volume: string;
}

export interface BonusTotalPayoutQuery {
  organizationId: number;
  period: BonusTotalPayoutPeriod;
  timezone: string;
}

export interface BonusChartPoint {
  label: string;
  value: number;
  highlighted?: boolean;
}

export type BonusPayoutStatus = "pending" | "failed" | "paid";

export interface BonusRecentPayout {
  id: string;
  amount: string;
  token: string;
  network: string;
  recipient: string;
  status: BonusPayoutStatus;
}

export interface BonusRecentPayoutsQuery {
  organizationId: number;
  limit: number;
}

export type BonusRowAction = "paying" | "pay_now";

export interface BonusPendingMember {
  id: string;
  name: string;
  address: string;
  email: string;
  purpose: string;
  description: string;
  amount: string;
  token: string;
}

export interface BonusPendingItem {
  id: string;
  batchId: number;
  title: string;
  amount: string;
  token: string;
  action: BonusRowAction;
  members: BonusPendingMember[];
}

export interface BonusPendingList {
  totalAmount: string;
  token: string;
  /** Member count from `total_count`, not the number of batches. */
  entryCount: number;
  items: BonusPendingItem[];
}

export interface BonusOpenQuery {
  organizationId: number;
}

/** Flat row used when seeding the Add drawer from CSV or a single-member item. */
export interface BonusPendingRow {
  id: string;
  name: string;
  address: string;
  email: string;
  token: string;
  network: string;
  amount: string;
  memo?: string;
}

export interface BonusHistoryItem {
  id: string;
  title: string;
  totalPayout: string;
  memberCount: number;
  executedAt: string;
  recipient: string;
}

export interface BonusHistoryQuery {
  organizationId: number;
  page: number;
  pageSize: number;
  startTime?: number;
  endTime?: number;
}

export interface BonusHistoryExportQuery {
  organizationId: number;
  startTime?: number;
  endTime?: number;
}

export interface BonusHistoryResp {
  total: number;
  totalPage: number;
  list: BonusHistoryItem[];
}

/** Field max lengths from `POST /v1/payroll/bonuses/import`. */
export const BONUS_IMPORT_LIMITS = {
  title: 100,
  name: 50,
  address: 128,
  email: 100,
  network: 32,
  symbol: 32,
  purpose: 100,
  description: 5000,
} as const;

export interface BonusImportItem {
  name: string;
  address: string;
  amount: string;
  network: string;
  symbol: string;
  email?: string;
  description?: string;
  purpose?: string;
}

export interface BonusImportParam {
  organizationId: number;
  title: string;
  items: BonusImportItem[];
}

export interface BonusImportResp {
  batchId: number;
  count: number;
}
