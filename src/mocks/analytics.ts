import { VOLUME_RANGE, type VolumeRange } from "@/mocks/home";

export { VOLUME_RANGE };
export type { VolumeRange };

export const LATEST_PAYOUT_STATUS = {
  InProgress: "in_progress",
} as const;

export type LatestPayoutStatus =
  (typeof LATEST_PAYOUT_STATUS)[keyof typeof LATEST_PAYOUT_STATUS];

export type AnalyticsVolumePoint = {
  label: string;
  value: number;
  changePercent: number | null;
};

export type AssetToken = {
  symbol: string;
  network: string;
};

export type LatestPayout = {
  id: string;
  status: LatestPayoutStatus;
  time: string;
  origin: AssetToken;
  dest: AssetToken;
};

export type CalendarDay = {
  date: string;
  paymentUsd: number;
  payouts: number;
};

export type AssetShare = {
  symbol: string;
  percent: number;
};

export type NetworkShare = {
  network: string;
  percent: number;
};

export type MonthSummary = {
  totalPaymentUsd: number | null;
  totalPayouts: number | null;
  recipients: number | null;
  calendarDays: CalendarDay[];
  assets: AssetShare[];
  networks: NetworkShare[];
};

export type AnalyticsDashboard = {
  months: string[];
  totalPaymentUsd: number | null;
  totalPayouts: number | null;
  recipients: number | null;
  volume: AnalyticsVolumePoint[];
  latestPayouts: LatestPayout[];
  calendarDays: CalendarDay[];
  assets: AssetShare[];
  networks: NetworkShare[];
};

export const DEFAULT_ANALYTICS_MONTH = "2026-08";

const VOLUME_BY_RANGE: Record<VolumeRange, AnalyticsVolumePoint[]> = {
  [VOLUME_RANGE.Daily]: [
    { label: "Mon", value: 4200, changePercent: null },
    { label: "Tue", value: 6100, changePercent: 45 },
    { label: "Wed", value: 5300, changePercent: -13 },
    { label: "Thu", value: 7800, changePercent: 47 },
    { label: "Fri", value: 9100, changePercent: 17 },
    { label: "Sat", value: 6400, changePercent: -30 },
    { label: "Sun", value: 8700, changePercent: 36 },
  ],
  [VOLUME_RANGE.Weekly]: [
    { label: "W1", value: 18000, changePercent: null },
    { label: "W2", value: 22400, changePercent: 24 },
    { label: "W3", value: 19600, changePercent: -13 },
    { label: "W4", value: 25100, changePercent: 28 },
    { label: "W5", value: 23800, changePercent: -5 },
    { label: "W6", value: 27400, changePercent: 15 },
    { label: "W7", value: 30100, changePercent: 10 },
    { label: "W8", value: 28600, changePercent: -5 },
  ],
  [VOLUME_RANGE.Monthly]: [
    { label: "Mar", value: 72200, changePercent: 12 },
    { label: "Apr", value: 46500, changePercent: -35 },
    { label: "May", value: 56100, changePercent: 12 },
    { label: "Jun", value: 64500, changePercent: 12 },
    { label: "Jul", value: 50500, changePercent: -8 },
    { label: "Aug", value: 56500, changePercent: 3 },
  ],
  [VOLUME_RANGE.All]: [
    { label: "2024", value: 210000, changePercent: null },
    { label: "2025", value: 384000, changePercent: 83 },
    { label: "2026", value: 65880, changePercent: -83 },
  ],
};

const LATEST_PAYOUTS: LatestPayout[] = [
  {
    id: "latest-1",
    status: LATEST_PAYOUT_STATUS.InProgress,
    time: "2026-08-01T11:56:00",
    origin: { symbol: "USDT", network: "Arbitrum" },
    dest: { symbol: "USDT", network: "Arbitrum" },
  },
  {
    id: "latest-2",
    status: LATEST_PAYOUT_STATUS.InProgress,
    time: "2026-08-01T11:56:00",
    origin: { symbol: "USDT", network: "Ethereum" },
    dest: { symbol: "USDC", network: "Base" },
  },
  {
    id: "latest-3",
    status: LATEST_PAYOUT_STATUS.InProgress,
    time: "2026-08-01T11:56:00",
    origin: { symbol: "USDC", network: "Arbitrum" },
    dest: { symbol: "USDC", network: "Arbitrum" },
  },
  {
    id: "latest-4",
    status: LATEST_PAYOUT_STATUS.InProgress,
    time: "2026-08-01T11:56:00",
    origin: { symbol: "USDT", network: "BNB Chain" },
    dest: { symbol: "PYUSD", network: "Ethereum" },
  },
  {
    id: "latest-5",
    status: LATEST_PAYOUT_STATUS.InProgress,
    time: "2026-08-01T11:56:00",
    origin: { symbol: "USDC", network: "Solana" },
    dest: { symbol: "USDT", network: "Solana" },
  },
  {
    id: "latest-6",
    status: LATEST_PAYOUT_STATUS.InProgress,
    time: "2026-08-01T11:56:00",
    origin: { symbol: "USDT", network: "Base" },
    dest: { symbol: "USDT", network: "Base" },
  },
];

const MONTH_SUMMARY: Record<string, MonthSummary> = {
  "2026-03": {
    totalPaymentUsd: 72200,
    totalPayouts: 9,
    recipients: 8,
    calendarDays: [
      { date: "2026-03-04", paymentUsd: 12000, payouts: 2 },
      { date: "2026-03-18", paymentUsd: 18000, payouts: 3 },
      { date: "2026-03-27", paymentUsd: 15000, payouts: 4 },
    ],
    assets: [
      { symbol: "USDT", percent: 40 },
      { symbol: "USDC", percent: 38 },
      { symbol: "PYUSD", percent: 22 },
    ],
    networks: [
      { network: "Ethereum", percent: 38 },
      { network: "Arbitrum", percent: 28 },
      { network: "BNB Chain", percent: 16 },
      { network: "Solana", percent: 10 },
      { network: "Base", percent: 5 },
      { network: "Optimism", percent: 3 },
    ],
  },
  "2026-04": {
    totalPaymentUsd: 46500,
    totalPayouts: 7,
    recipients: 7,
    calendarDays: [
      { date: "2026-04-08", paymentUsd: 9000, payouts: 2 },
      { date: "2026-04-22", paymentUsd: 14000, payouts: 3 },
    ],
    assets: [
      { symbol: "USDT", percent: 31 },
      { symbol: "USDC", percent: 49 },
      { symbol: "PYUSD", percent: 20 },
    ],
    networks: [
      { network: "Ethereum", percent: 44 },
      { network: "Arbitrum", percent: 22 },
      { network: "Base", percent: 14 },
      { network: "BNB Chain", percent: 12 },
      { network: "Solana", percent: 8 },
    ],
  },
  "2026-05": {
    totalPaymentUsd: 56100,
    totalPayouts: 10,
    recipients: 9,
    calendarDays: [
      { date: "2026-05-06", paymentUsd: 11000, payouts: 3 },
      { date: "2026-05-19", paymentUsd: 16000, payouts: 4 },
      { date: "2026-05-28", paymentUsd: 8000, payouts: 2 },
    ],
    assets: [
      { symbol: "USDT", percent: 28 },
      { symbol: "USDC", percent: 44 },
      { symbol: "PYUSD", percent: 28 },
    ],
    networks: [
      { network: "Arbitrum", percent: 32 },
      { network: "Ethereum", percent: 30 },
      { network: "BNB Chain", percent: 18 },
      { network: "Solana", percent: 12 },
      { network: "Base", percent: 8 },
    ],
  },
  "2026-06": {
    totalPaymentUsd: 64500,
    totalPayouts: 11,
    recipients: 10,
    calendarDays: [
      { date: "2026-06-02", paymentUsd: 10000, payouts: 2 },
      { date: "2026-06-12", paymentUsd: 21000, payouts: 5 },
      { date: "2026-06-24", paymentUsd: 13000, payouts: 3 },
    ],
    assets: [
      { symbol: "USDT", percent: 35 },
      { symbol: "USDC", percent: 40 },
      { symbol: "PYUSD", percent: 25 },
    ],
    networks: [
      { network: "Ethereum", percent: 36 },
      { network: "Arbitrum", percent: 26 },
      { network: "BNB Chain", percent: 20 },
      { network: "Solana", percent: 11 },
      { network: "Base", percent: 7 },
    ],
  },
  "2026-07": {
    totalPaymentUsd: 50500,
    totalPayouts: 8,
    recipients: 8,
    calendarDays: [
      { date: "2026-07-07", paymentUsd: 7000, payouts: 2 },
      { date: "2026-07-16", paymentUsd: 19000, payouts: 4 },
      { date: "2026-07-30", paymentUsd: 9000, payouts: 2 },
    ],
    assets: [
      { symbol: "USDT", percent: 20 },
      { symbol: "USDC", percent: 55 },
      { symbol: "PYUSD", percent: 25 },
    ],
    networks: [
      { network: "Ethereum", percent: 40 },
      { network: "Arbitrum", percent: 25 },
      { network: "Base", percent: 15 },
      { network: "BNB Chain", percent: 12 },
      { network: "Solana", percent: 8 },
    ],
  },
  "2026-08": {
    totalPaymentUsd: 65880,
    totalPayouts: 12,
    recipients: 12,
    calendarDays: [
      { date: "2026-08-01", paymentUsd: 8500, payouts: 2 },
      { date: "2026-08-09", paymentUsd: 12000, payouts: 3 },
      { date: "2026-08-15", paymentUsd: 14880, payouts: 4 },
      { date: "2026-08-25", paymentUsd: 20000, payouts: 6 },
    ],
    assets: [
      { symbol: "USDT", percent: 23 },
      { symbol: "USDC", percent: 42 },
      { symbol: "PYUSD", percent: 18 },
    ],
    networks: [
      { network: "Ethereum", percent: 42 },
      { network: "Arbitrum", percent: 23 },
      { network: "BNB Chain", percent: 18 },
      { network: "Solana", percent: 12 },
      { network: "Base", percent: 5 },
      { network: "Optimism", percent: 0 },
    ],
  },
};

const EMPTY_SUMMARY: MonthSummary = {
  totalPaymentUsd: null,
  totalPayouts: null,
  recipients: null,
  calendarDays: [],
  assets: [],
  networks: [],
};

export const PAYOUT_NETWORKS_LIMIT = 5;

export function getAnalytics(params: {
  month?: string;
  range?: VolumeRange;
}): AnalyticsDashboard {
  const month = params.month ?? DEFAULT_ANALYTICS_MONTH;
  const range = params.range ?? VOLUME_RANGE.Monthly;
  const summary = MONTH_SUMMARY[month] ?? EMPTY_SUMMARY;
  const networks = [...summary.networks]
    .filter((item) => item.percent > 0)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, PAYOUT_NETWORKS_LIMIT);

  return {
    months: Object.keys(MONTH_SUMMARY).sort(),
    totalPaymentUsd: summary.totalPaymentUsd,
    totalPayouts: summary.totalPayouts,
    recipients: summary.recipients,
    volume: VOLUME_BY_RANGE[range],
    latestPayouts: LATEST_PAYOUTS,
    calendarDays: summary.calendarDays,
    assets: summary.assets,
    networks,
  };
}
