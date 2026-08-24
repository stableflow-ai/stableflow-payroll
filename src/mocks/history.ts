import { PAYOUT_STATUS } from "@/mocks/home";

export const HISTORY_STATUS = {
  Complete: PAYOUT_STATUS.Complete,
  Failed: PAYOUT_STATUS.Failed,
} as const;

export type HistoryStatus = (typeof HISTORY_STATUS)[keyof typeof HISTORY_STATUS];

export type HistoryPayout = {
  id: string;
  recipient: string;
  amount: string;
  symbol: string;
  network: string;
  memo: string | null;
  time: string;
  status: HistoryStatus;
  txUrl: string | null;
};

const SAMPLE_ADDRESS = "0x541aaaaaaaaaaaaaaaaaaaaaaaaaaa38Dc1";
const SAMPLE_TX_URL = "https://arbiscan.io/tx/0xabc";

const HISTORY: HistoryPayout[] = [
  {
    id: "h-1",
    recipient: SAMPLE_ADDRESS,
    amount: "5000",
    symbol: "USDC",
    network: "Arbitrum",
    memo: "include expense",
    time: "2026-08-01T11:56:00",
    status: HISTORY_STATUS.Complete,
    txUrl: SAMPLE_TX_URL,
  },
  {
    id: "h-2",
    recipient: SAMPLE_ADDRESS,
    amount: "1000",
    symbol: "USDT",
    network: "Ethereum",
    memo: null,
    time: "2026-07-15T11:56:00",
    status: HISTORY_STATUS.Complete,
    txUrl: SAMPLE_TX_URL,
  },
  {
    id: "h-3",
    recipient: SAMPLE_ADDRESS,
    amount: "500",
    symbol: "USDC",
    network: "Arbitrum",
    memo: "Chat GPT 5-6 vip package",
    time: "2026-06-01T11:56:00",
    status: HISTORY_STATUS.Complete,
    txUrl: SAMPLE_TX_URL,
  },
  {
    id: "h-4",
    recipient: SAMPLE_ADDRESS,
    amount: "5000",
    symbol: "USDC",
    network: "Arbitrum",
    memo: "include expense",
    time: "2026-05-20T09:12:00",
    status: HISTORY_STATUS.Complete,
    txUrl: SAMPLE_TX_URL,
  },
  {
    id: "h-5",
    recipient: SAMPLE_ADDRESS,
    amount: "1000",
    symbol: "USDT",
    network: "Ethereum",
    memo: null,
    time: "2026-04-18T14:05:00",
    status: HISTORY_STATUS.Failed,
    txUrl: null,
  },
  {
    id: "h-6",
    recipient: SAMPLE_ADDRESS,
    amount: "500",
    symbol: "USDC",
    network: "Arbitrum",
    memo: null,
    time: "2026-03-11T08:30:00",
    status: HISTORY_STATUS.Complete,
    txUrl: SAMPLE_TX_URL,
  },
  {
    id: "h-7",
    recipient: SAMPLE_ADDRESS,
    amount: "2500",
    symbol: "USDC",
    network: "Base",
    memo: "payroll April",
    time: "2026-02-28T16:40:00",
    status: HISTORY_STATUS.Complete,
    txUrl: SAMPLE_TX_URL,
  },
  {
    id: "h-8",
    recipient: SAMPLE_ADDRESS,
    amount: "750",
    symbol: "USDT",
    network: "Arbitrum",
    memo: "contractor fee",
    time: "2026-01-09T10:00:00",
    status: HISTORY_STATUS.Complete,
    txUrl: SAMPLE_TX_URL,
  },
  {
    id: "h-9",
    recipient: SAMPLE_ADDRESS,
    amount: "3200",
    symbol: "USDC",
    network: "Ethereum",
    memo: "Q1 bonus",
    time: "2025-12-15T11:56:00",
    status: HISTORY_STATUS.Complete,
    txUrl: SAMPLE_TX_URL,
  },
  {
    id: "h-10",
    recipient: SAMPLE_ADDRESS,
    amount: "180",
    symbol: "USDT",
    network: "Base",
    memo: null,
    time: "2025-11-02T07:22:00",
    status: HISTORY_STATUS.Failed,
    txUrl: null,
  },
  {
    id: "h-11",
    recipient: SAMPLE_ADDRESS,
    amount: "900",
    symbol: "USDC",
    network: "Arbitrum",
    memo: "office rent",
    time: "2025-10-21T13:15:00",
    status: HISTORY_STATUS.Complete,
    txUrl: SAMPLE_TX_URL,
  },
  {
    id: "h-12",
    recipient: SAMPLE_ADDRESS,
    amount: "4100",
    symbol: "USDT",
    network: "Ethereum",
    memo: "vendor invoice 8821",
    time: "2025-09-04T18:48:00",
    status: HISTORY_STATUS.Complete,
    txUrl: SAMPLE_TX_URL,
  },
];

export function getTransactionHistory(): HistoryPayout[] {
  return HISTORY;
}
