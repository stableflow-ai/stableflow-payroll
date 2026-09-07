import { HISTORY_FILTER_ALL, HISTORY_PAGE_SIZE, HISTORY_STATUS_FILTER } from "@/views/pay/components/history/config";
import { historyMatchesAmount } from "@/views/pay/components/history/utils";

export type HistoryItem = {
  id: string;
  amount: string;
  token: string;
  network: string;
  destinationAmount: string;
  destinationToken: string;
  destinationNetwork: string;
  payer: string;
  recipient: string;
  txHash: string;
  destinationTxHash: string;
  status: string;
  submittedAt: string;
};

export type HistoryQuery = {
  page: number;
  pageSize: number;
  q?: string;
  status?: string;
  sourceNetwork?: string;
  sourceToken?: string;
  destNetwork?: string;
  destToken?: string;
  amountFilter?: string;
  start_time?: number;
  end_time?: number;
};

export type HistoryExportQuery = Omit<HistoryQuery, "page" | "pageSize">;

export type HistoryListResp = {
  total: number;
  totalPage: number;
  list: HistoryItem[];
};

const FROM_A = "0x1b5e4a9c2d8f7a0b3c6d9e1f4a7b0c3d5e4f9C";
const FROM_B = "0x557be3f47a45499385f60cd64e2ff455e42a3311";
const TO_A = "0x541a9b0e0e1c2d3f4a5b6c7d8e9f0a1b2c3d8dc1";
const TO_B = "0x253ef6020000000000000000000000000000ef02";
const TX_A = "0xaaa111bbb222ccc333ddd444eee555fff666777888999000aaabbbcccdddeee";
const TX_B = "0xbbb222ccc333ddd444eee555fff666777888999000aaabbbcccdddeeefffaaa";

function daysAgoIso(days: number, hour = 11, minute = 56): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function row(
  id: string,
  fields: Omit<HistoryItem, "id">,
): HistoryItem {
  return { id, ...fields };
}

const ROWS: HistoryItem[] = [
  row("hist-1", {
    amount: "11000",
    token: "USDT",
    network: "base",
    destinationAmount: "10999.98",
    destinationToken: "USDC",
    destinationNetwork: "arb",
    payer: FROM_A,
    recipient: TO_A,
    txHash: TX_A,
    destinationTxHash: TX_B,
    status: HISTORY_STATUS_FILTER.Success,
    submittedAt: daysAgoIso(2),
  }),
  row("hist-2", {
    amount: "11000",
    token: "USDT",
    network: "base",
    destinationAmount: "10999.98",
    destinationToken: "USDC",
    destinationNetwork: "arb",
    payer: FROM_A,
    recipient: TO_A,
    txHash: TX_B,
    destinationTxHash: TX_A,
    status: HISTORY_STATUS_FILTER.Success,
    submittedAt: daysAgoIso(3),
  }),
  row("hist-3", {
    amount: "250",
    token: "USDC",
    network: "eth",
    destinationAmount: "249.5",
    destinationToken: "USDT",
    destinationNetwork: "base",
    payer: FROM_B,
    recipient: TO_B,
    txHash: TX_A,
    destinationTxHash: TX_B,
    status: HISTORY_STATUS_FILTER.Failed,
    submittedAt: daysAgoIso(4),
  }),
  row("hist-4", {
    amount: "4500",
    token: "USDC",
    network: "arb",
    destinationAmount: "4499.2",
    destinationToken: "USDC",
    destinationNetwork: "eth",
    payer: FROM_A,
    recipient: TO_B,
    txHash: TX_B,
    destinationTxHash: TX_A,
    status: HISTORY_STATUS_FILTER.Success,
    submittedAt: daysAgoIso(5),
  }),
  row("hist-5", {
    amount: "18000",
    token: "USDT",
    network: "eth",
    destinationAmount: "17990",
    destinationToken: "USDT",
    destinationNetwork: "sol",
    payer: FROM_B,
    recipient: TO_A,
    txHash: TX_A,
    destinationTxHash: TX_B,
    status: HISTORY_STATUS_FILTER.Success,
    submittedAt: daysAgoIso(6),
  }),
  row("hist-6", {
    amount: "80",
    token: "DAI",
    network: "pol",
    destinationAmount: "79.9",
    destinationToken: "USDC",
    destinationNetwork: "base",
    payer: FROM_A,
    recipient: TO_A,
    txHash: TX_B,
    destinationTxHash: TX_A,
    status: HISTORY_STATUS_FILTER.Failed,
    submittedAt: daysAgoIso(7),
  }),
  row("hist-7", {
    amount: "3200",
    token: "USDT",
    network: "op",
    destinationAmount: "3198.4",
    destinationToken: "USDC",
    destinationNetwork: "arb",
    payer: FROM_B,
    recipient: TO_B,
    txHash: TX_A,
    destinationTxHash: TX_B,
    status: HISTORY_STATUS_FILTER.Success,
    submittedAt: daysAgoIso(8),
  }),
  row("hist-8", {
    amount: "999",
    token: "USDC",
    network: "base",
    destinationAmount: "998.1",
    destinationToken: "USDT",
    destinationNetwork: "eth",
    payer: FROM_A,
    recipient: TO_A,
    txHash: TX_B,
    destinationTxHash: TX_A,
    status: HISTORY_STATUS_FILTER.Success,
    submittedAt: daysAgoIso(9),
  }),
  row("hist-9", {
    amount: "12500",
    token: "USDT",
    network: "bsc",
    destinationAmount: "12488",
    destinationToken: "USDC",
    destinationNetwork: "arb",
    payer: FROM_B,
    recipient: TO_A,
    txHash: TX_A,
    destinationTxHash: TX_B,
    status: HISTORY_STATUS_FILTER.Failed,
    submittedAt: daysAgoIso(10),
  }),
  row("hist-10", {
    amount: "7600",
    token: "USDC",
    network: "avax",
    destinationAmount: "7595",
    destinationToken: "USDT",
    destinationNetwork: "near",
    payer: FROM_A,
    recipient: TO_B,
    txHash: TX_B,
    destinationTxHash: TX_A,
    status: HISTORY_STATUS_FILTER.Success,
    submittedAt: daysAgoIso(11),
  }),
  row("hist-11", {
    amount: "42",
    token: "USDT",
    network: "tron",
    destinationAmount: "41.8",
    destinationToken: "USDC",
    destinationNetwork: "eth",
    payer: FROM_B,
    recipient: TO_A,
    txHash: TX_A,
    destinationTxHash: TX_B,
    status: HISTORY_STATUS_FILTER.Success,
    submittedAt: daysAgoIso(12),
  }),
  row("hist-12", {
    amount: "2100",
    token: "USDC",
    network: "base",
    destinationAmount: "2098.6",
    destinationToken: "USDC",
    destinationNetwork: "pol",
    payer: FROM_A,
    recipient: TO_A,
    txHash: TX_B,
    destinationTxHash: TX_A,
    status: HISTORY_STATUS_FILTER.Success,
    submittedAt: daysAgoIso(13),
  }),
  row("hist-13", {
    amount: "15000",
    token: "USDT",
    network: "eth",
    destinationAmount: "14992",
    destinationToken: "USDT",
    destinationNetwork: "tron",
    payer: FROM_B,
    recipient: TO_B,
    txHash: TX_A,
    destinationTxHash: TX_B,
    status: HISTORY_STATUS_FILTER.Failed,
    submittedAt: daysAgoIso(14),
  }),
  row("hist-14", {
    amount: "640",
    token: "DAI",
    network: "eth",
    destinationAmount: "639.2",
    destinationToken: "USDC",
    destinationNetwork: "arb",
    payer: FROM_A,
    recipient: TO_A,
    txHash: TX_B,
    destinationTxHash: TX_A,
    status: HISTORY_STATUS_FILTER.Success,
    submittedAt: daysAgoIso(15),
  }),
  row("hist-15", {
    amount: "8800",
    token: "USDT",
    network: "sol",
    destinationAmount: "8794",
    destinationToken: "USDC",
    destinationNetwork: "base",
    payer: FROM_B,
    recipient: TO_A,
    txHash: TX_A,
    destinationTxHash: TX_B,
    status: HISTORY_STATUS_FILTER.Success,
    submittedAt: daysAgoIso(16),
  }),
  row("hist-16", {
    amount: "11000",
    token: "USDT",
    network: "base",
    destinationAmount: "10999.98",
    destinationToken: "USDC",
    destinationNetwork: "arb",
    payer: FROM_A,
    recipient: TO_A,
    txHash: TX_B,
    destinationTxHash: TX_A,
    status: HISTORY_STATUS_FILTER.Success,
    submittedAt: daysAgoIso(17),
  }),
  row("hist-17", {
    amount: "300",
    token: "USDC",
    network: "arb",
    destinationAmount: "299.4",
    destinationToken: "USDT",
    destinationNetwork: "op",
    payer: FROM_B,
    recipient: TO_B,
    txHash: TX_A,
    destinationTxHash: TX_B,
    status: HISTORY_STATUS_FILTER.Failed,
    submittedAt: daysAgoIso(18),
  }),
  row("hist-18", {
    amount: "5400",
    token: "USDT",
    network: "near",
    destinationAmount: "5396",
    destinationToken: "USDC",
    destinationNetwork: "eth",
    payer: FROM_A,
    recipient: TO_A,
    txHash: TX_B,
    destinationTxHash: TX_A,
    status: HISTORY_STATUS_FILTER.Success,
    submittedAt: daysAgoIso(19),
  }),
  row("hist-19", {
    amount: "22000",
    token: "USDC",
    network: "eth",
    destinationAmount: "21980",
    destinationToken: "USDT",
    destinationNetwork: "base",
    payer: FROM_B,
    recipient: TO_A,
    txHash: TX_A,
    destinationTxHash: TX_B,
    status: HISTORY_STATUS_FILTER.Success,
    submittedAt: daysAgoIso(20),
  }),
  row("hist-20", {
    amount: "12",
    token: "USDT",
    network: "base",
    destinationAmount: "11.9",
    destinationToken: "USDC",
    destinationNetwork: "arb",
    payer: FROM_A,
    recipient: TO_B,
    txHash: TX_B,
    destinationTxHash: TX_A,
    status: HISTORY_STATUS_FILTER.Failed,
    submittedAt: daysAgoIso(21),
  }),
  row("hist-21", {
    amount: "4100",
    token: "USDC",
    network: "pol",
    destinationAmount: "4096",
    destinationToken: "USDT",
    destinationNetwork: "eth",
    payer: FROM_B,
    recipient: TO_A,
    txHash: TX_A,
    destinationTxHash: TX_B,
    status: HISTORY_STATUS_FILTER.Success,
    submittedAt: daysAgoIso(22),
  }),
  row("hist-22", {
    amount: "960",
    token: "USDT",
    network: "op",
    destinationAmount: "958.5",
    destinationToken: "USDC",
    destinationNetwork: "base",
    payer: FROM_A,
    recipient: TO_A,
    txHash: TX_B,
    destinationTxHash: TX_A,
    status: HISTORY_STATUS_FILTER.Success,
    submittedAt: daysAgoIso(23),
  }),
  row("hist-23", {
    amount: "13300",
    token: "USDT",
    network: "arb",
    destinationAmount: "13290",
    destinationToken: "USDC",
    destinationNetwork: "sol",
    payer: FROM_B,
    recipient: TO_B,
    txHash: TX_A,
    destinationTxHash: TX_B,
    status: HISTORY_STATUS_FILTER.Success,
    submittedAt: daysAgoIso(24),
  }),
  row("hist-24", {
    amount: "1750",
    token: "DAI",
    network: "gnosis",
    destinationAmount: "1748",
    destinationToken: "USDC",
    destinationNetwork: "eth",
    payer: FROM_A,
    recipient: TO_A,
    txHash: TX_B,
    destinationTxHash: TX_A,
    status: HISTORY_STATUS_FILTER.Failed,
    submittedAt: daysAgoIso(25),
  }),
  row("hist-25", {
    amount: "6700",
    token: "USDC",
    network: "scroll",
    destinationAmount: "6694",
    destinationToken: "USDT",
    destinationNetwork: "base",
    payer: FROM_B,
    recipient: TO_A,
    txHash: TX_A,
    destinationTxHash: TX_B,
    status: HISTORY_STATUS_FILTER.Success,
    submittedAt: daysAgoIso(26),
  }),
  row("hist-26", {
    amount: "11000",
    token: "USDT",
    network: "base",
    destinationAmount: "10999.98",
    destinationToken: "USDC",
    destinationNetwork: "arb",
    payer: FROM_A,
    recipient: TO_A,
    txHash: TX_B,
    destinationTxHash: TX_A,
    status: HISTORY_STATUS_FILTER.Success,
    submittedAt: daysAgoIso(27),
  }),
  row("hist-27", {
    amount: "55",
    token: "USDT",
    network: "eth",
    destinationAmount: "54.7",
    destinationToken: "USDC",
    destinationNetwork: "arb",
    payer: FROM_B,
    recipient: TO_B,
    txHash: TX_A,
    destinationTxHash: TX_B,
    status: HISTORY_STATUS_FILTER.Failed,
    submittedAt: daysAgoIso(28),
  }),
  row("hist-28", {
    amount: "8900",
    token: "USDC",
    network: "base",
    destinationAmount: "8892",
    destinationToken: "USDT",
    destinationNetwork: "tron",
    payer: FROM_A,
    recipient: TO_A,
    txHash: TX_B,
    destinationTxHash: TX_A,
    status: HISTORY_STATUS_FILTER.Success,
    submittedAt: daysAgoIso(1),
  }),
  row("hist-29", {
    amount: "25000",
    token: "USDT",
    network: "eth",
    destinationAmount: "24970",
    destinationToken: "USDC",
    destinationNetwork: "arb",
    payer: FROM_B,
    recipient: TO_A,
    txHash: TX_A,
    destinationTxHash: TX_B,
    status: HISTORY_STATUS_FILTER.Success,
    submittedAt: daysAgoIso(0, 10, 12),
  }),
  row("hist-30", {
    amount: "420",
    token: "USDC",
    network: "arb",
    destinationAmount: "419.1",
    destinationToken: "USDT",
    destinationNetwork: "base",
    payer: FROM_A,
    recipient: TO_B,
    txHash: TX_B,
    destinationTxHash: TX_A,
    status: HISTORY_STATUS_FILTER.Failed,
    submittedAt: daysAgoIso(0, 9, 40),
  }),
];

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function matchesSearch(row: HistoryItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [row.payer, row.recipient, row.txHash, row.destinationTxHash]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

function filteredRows(params: HistoryExportQuery): HistoryItem[] {
  const status = params.status?.trim();
  const sourceNetwork = params.sourceNetwork?.trim();
  const sourceToken = params.sourceToken?.trim();
  const destNetwork = params.destNetwork?.trim();
  const destToken = params.destToken?.trim();
  const amountFilter = params.amountFilter ?? HISTORY_FILTER_ALL;
  const start = params.start_time;
  const end = params.end_time;

  return ROWS.filter((item) => {
    if (!matchesSearch(item, params.q ?? "")) return false;
    if (status && status !== HISTORY_FILTER_ALL && item.status !== status) return false;
    if (sourceNetwork && item.network !== sourceNetwork) return false;
    if (sourceToken && item.token !== sourceToken) return false;
    if (destNetwork && item.destinationNetwork !== destNetwork) return false;
    if (destToken && item.destinationToken !== destToken) return false;
    if (!historyMatchesAmount(item.amount, amountFilter)) return false;
    if (start != null || end != null) {
      const time = Math.floor(new Date(item.submittedAt).getTime() / 1000);
      if (Number.isNaN(time)) return false;
      if (start != null && time < start) return false;
      if (end != null && time > end) return false;
    }
    return true;
  });
}

export async function listHistory(params: HistoryQuery): Promise<HistoryListResp> {
  await delay(250);
  const list = filteredRows(params);
  const pageSize = Math.max(1, params.pageSize || HISTORY_PAGE_SIZE);
  const total = list.length;
  const totalPage = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, params.page), totalPage);
  const start = (page - 1) * pageSize;
  return {
    total,
    totalPage,
    list: list.slice(start, start + pageSize),
  };
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function exportHistory(params: HistoryExportQuery): Promise<{ blob: Blob; filename: string }> {
  await delay(200);
  const rows = filteredRows(params);
  const header = [
    "amount",
    "source_token",
    "source_network",
    "received",
    "destination_token",
    "destination_network",
    "from",
    "to",
    "time",
    "status",
  ];
  const lines = [
    header.join(","),
    ...rows.map((row) =>
      [
        row.amount,
        row.token,
        row.network,
        row.destinationAmount,
        row.destinationToken,
        row.destinationNetwork,
        row.payer,
        row.recipient,
        row.submittedAt,
        row.status,
      ]
        .map(csvCell)
        .join(","),
    ),
  ];
  return {
    blob: new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }),
    filename: "transaction-history.csv",
  };
}
