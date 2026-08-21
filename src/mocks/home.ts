export const VOLUME_RANGE = {
  Daily: "daily",
  Weekly: "weekly",
  Monthly: "monthly",
  All: "all",
} as const;

export type VolumeRange = (typeof VOLUME_RANGE)[keyof typeof VOLUME_RANGE];

export const PAYOUT_STATUS = {
  Complete: "complete",
  Failed: "failed",
} as const;

export type PayoutStatus = (typeof PAYOUT_STATUS)[keyof typeof PAYOUT_STATUS];

export type VolumePoint = {
  label: string;
  value: number;
};

export type TokenBalance = {
  symbol: string;
  amount: number;
};

export type PendingPayout = {
  id: string;
  amount: number;
  symbol: string;
  network: string;
  toAddress: string;
};

export type RecentPayout = {
  id: string;
  recipient: string;
  amount: number;
  symbol: string;
  network: string;
  time: string;
  status: PayoutStatus;
  txUrl: string | null;
};

export type HomeDashboard = {
  balanceUsd: number;
  tokens: TokenBalance[];
  totalPaymentUsd: number | null;
  recipients: number | null;
  volume: VolumePoint[];
  pendingPayouts: PendingPayout[];
  recentPayouts: RecentPayout[];
};

const SAMPLE_ADDRESS = "0x541aaaaaaaaaaaaaaaaaaaaaaaaaaa38Dc1";
const SAMPLE_TX_URL = "https://arbiscan.io/tx/0xabc";

const VOLUME_BY_RANGE: Record<VolumeRange, VolumePoint[]> = {
  [VOLUME_RANGE.Daily]: [
    { label: "Mon", value: 4200 },
    { label: "Tue", value: 6100 },
    { label: "Wed", value: 5300 },
    { label: "Thu", value: 7800 },
    { label: "Fri", value: 9100 },
    { label: "Sat", value: 6400 },
    { label: "Sun", value: 8700 },
  ],
  [VOLUME_RANGE.Weekly]: [
    { label: "W1", value: 18000 },
    { label: "W2", value: 22400 },
    { label: "W3", value: 19600 },
    { label: "W4", value: 25100 },
    { label: "W5", value: 23800 },
    { label: "W6", value: 27400 },
    { label: "W7", value: 30100 },
    { label: "W8", value: 28600 },
  ],
  [VOLUME_RANGE.Monthly]: [
    { label: "Mar", value: 28000 },
    { label: "Apr", value: 34000 },
    { label: "May", value: 41000 },
    { label: "Jun", value: 36000 },
    { label: "Jul", value: 47000 },
    { label: "Aug", value: 52000 },
  ],
  [VOLUME_RANGE.All]: [
    { label: "2024", value: 210000 },
    { label: "2025", value: 384000 },
    { label: "2026", value: 65880 },
  ],
};

const PENDING_PAYOUTS: PendingPayout[] = [
  {
    id: "pending-1",
    amount: 1000,
    symbol: "USDT",
    network: "Base",
    toAddress: SAMPLE_ADDRESS,
  },
  {
    id: "pending-2",
    amount: 2000,
    symbol: "USDC",
    network: "Arbitrum",
    toAddress: SAMPLE_ADDRESS,
  },
];

const RECENT_PAYOUTS: RecentPayout[] = [
  {
    id: "recent-1",
    recipient: SAMPLE_ADDRESS,
    amount: 5000,
    symbol: "USDC",
    network: "Arbitrum",
    time: "2026-08-01T11:56:00",
    status: PAYOUT_STATUS.Complete,
    txUrl: SAMPLE_TX_URL,
  },
  {
    id: "recent-2",
    recipient: SAMPLE_ADDRESS,
    amount: 1000,
    symbol: "USDT",
    network: "Ethereum",
    time: "2026-07-15T11:56:00",
    status: PAYOUT_STATUS.Failed,
    txUrl: null,
  },
  {
    id: "recent-3",
    recipient: SAMPLE_ADDRESS,
    amount: 500,
    symbol: "USDC",
    network: "Arbitrum",
    time: "2026-06-01T11:56:00",
    status: PAYOUT_STATUS.Complete,
    txUrl: SAMPLE_TX_URL,
  },
];

export function getHomeDashboard(range: VolumeRange = VOLUME_RANGE.Monthly): HomeDashboard {
  return {
    balanceUsd: 5520,
    tokens: [
      { symbol: "USDT", amount: 1520 },
      { symbol: "USDC", amount: 3999.52 },
    ],
    totalPaymentUsd: 65880,
    recipients: 12,
    volume: VOLUME_BY_RANGE[range],
    pendingPayouts: PENDING_PAYOUTS,
    recentPayouts: RECENT_PAYOUTS,
  };
}
