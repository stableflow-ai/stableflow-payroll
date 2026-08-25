export type PartnerReportAsset = {
  symbol: string;
  network: string;
};

export type PartnerReportKey = {
  id: string;
  label: string;
  key: string;
  createdAt: string;
};

export type PartnerReportTx = {
  id: string;
  apiKeyId: string;
  amount: number;
  received: number;
  source: PartnerReportAsset;
  dest: PartnerReportAsset;
  from: string;
  to: string;
  fromUrl: string;
  toUrl: string;
  time: string;
};

export type PartnerReports = {
  keys: PartnerReportKey[];
  rows: PartnerReportTx[];
};

const REPORT_KEYS: PartnerReportKey[] = [
  {
    id: "pk-demo-1",
    label: "Production",
    key: "sk-productiondemo0001",
    createdAt: "2026-06-01T08:00:00.000Z",
  },
  {
    id: "pk-demo-2",
    label: "Staging",
    key: "sk-stagingdemo000002",
    createdAt: "2026-07-12T08:00:00.000Z",
  },
];

const REPORT_FROM = "0x1b5a3c8e9d4f0a2176b8c3e54f9c000000004f9C";
const REPORT_TO = "0x541e90aa12bb77c4d8e0f1a2b3c4d5e68dc10001";

const REPORT_SEEDS: Array<{
  amount: number;
  received: number;
  source: PartnerReportAsset;
  dest: PartnerReportAsset;
  daysAgo: number;
  apiKeyId: string;
  hour: number;
}> = [
  { amount: 11000, received: 10999.98, source: { symbol: "USDT", network: "Base" }, dest: { symbol: "USDC", network: "Arbitrum" }, daysAgo: 0, apiKeyId: "pk-demo-1", hour: 11 },
  { amount: 420, received: 419.91, source: { symbol: "USDC", network: "Ethereum" }, dest: { symbol: "USDT", network: "Base" }, daysAgo: 0, apiKeyId: "pk-demo-2", hour: 9 },
  { amount: 880, received: 879.5, source: { symbol: "USDT", network: "Arbitrum" }, dest: { symbol: "USDC", network: "Optimism" }, daysAgo: 1, apiKeyId: "pk-demo-1", hour: 15 },
  { amount: 1500, received: 1499.2, source: { symbol: "USDC", network: "Polygon" }, dest: { symbol: "USDT", network: "Ethereum" }, daysAgo: 1, apiKeyId: "pk-demo-2", hour: 8 },
  { amount: 4500, received: 4498.11, source: { symbol: "USDT", network: "BNB Chain" }, dest: { symbol: "USDC", network: "Base" }, daysAgo: 2, apiKeyId: "pk-demo-1", hour: 12 },
  { amount: 9000, received: 8997.4, source: { symbol: "USDC", network: "Solana" }, dest: { symbol: "USDT", network: "Solana" }, daysAgo: 2, apiKeyId: "pk-demo-1", hour: 18 },
  { amount: 25000, received: 24992.08, source: { symbol: "USDT", network: "Ethereum" }, dest: { symbol: "USDC", network: "Arbitrum" }, daysAgo: 3, apiKeyId: "pk-demo-1", hour: 10 },
  { amount: 610, received: 609.4, source: { symbol: "USDC", network: "Base" }, dest: { symbol: "USDT", network: "Polygon" }, daysAgo: 3, apiKeyId: "pk-demo-2", hour: 14 },
  { amount: 3200, received: 3198.66, source: { symbol: "USDT", network: "Optimism" }, dest: { symbol: "USDC", network: "Ethereum" }, daysAgo: 4, apiKeyId: "pk-demo-1", hour: 11 },
  { amount: 17500, received: 17495.2, source: { symbol: "USDC", network: "Arbitrum" }, dest: { symbol: "USDT", network: "Base" }, daysAgo: 5, apiKeyId: "pk-demo-1", hour: 16 },
  { amount: 990, received: 988.7, source: { symbol: "USDT", network: "Avalanche" }, dest: { symbol: "USDC", network: "Avalanche" }, daysAgo: 5, apiKeyId: "pk-demo-2", hour: 7 },
  { amount: 7800, received: 7796.3, source: { symbol: "USDC", network: "Near" }, dest: { symbol: "USDT", network: "Ethereum" }, daysAgo: 6, apiKeyId: "pk-demo-1", hour: 13 },
  { amount: 2100, received: 2098.9, source: { symbol: "USDT", network: "Tron" }, dest: { symbol: "USDC", network: "Tron" }, daysAgo: 7, apiKeyId: "pk-demo-2", hour: 11 },
  { amount: 560, received: 559.2, source: { symbol: "USDC", network: "Gnosis" }, dest: { symbol: "USDT", network: "Ethereum" }, daysAgo: 8, apiKeyId: "pk-demo-2", hour: 9 },
  { amount: 12800, received: 12794.5, source: { symbol: "USDT", network: "Base" }, dest: { symbol: "USDC", network: "Optimism" }, daysAgo: 9, apiKeyId: "pk-demo-1", hour: 17 },
  { amount: 3400, received: 3398.1, source: { symbol: "USDC", network: "Ethereum" }, dest: { symbol: "USDT", network: "BNB Chain" }, daysAgo: 10, apiKeyId: "pk-demo-1", hour: 12 },
  { amount: 750, received: 749.05, source: { symbol: "USDT", network: "Polygon" }, dest: { symbol: "USDC", network: "Polygon" }, daysAgo: 11, apiKeyId: "pk-demo-2", hour: 8 },
  { amount: 6400, received: 6397.8, source: { symbol: "USDC", network: "Arbitrum" }, dest: { symbol: "USDT", network: "Solana" }, daysAgo: 12, apiKeyId: "pk-demo-1", hour: 15 },
  { amount: 19000, received: 18991.4, source: { symbol: "USDC", network: "Solana" }, dest: { symbol: "USDC", network: "Base" }, daysAgo: 13, apiKeyId: "pk-demo-1", hour: 10 },
  { amount: 280, received: 279.6, source: { symbol: "USDC", network: "Base" }, dest: { symbol: "USDT", network: "Arbitrum" }, daysAgo: 14, apiKeyId: "pk-demo-2", hour: 19 },
  { amount: 5100, received: 5097.2, source: { symbol: "USDT", network: "Ethereum" }, dest: { symbol: "USDC", network: "Plasma" }, daysAgo: 15, apiKeyId: "pk-demo-1", hour: 11 },
  { amount: 8600, received: 8594.9, source: { symbol: "USDC", network: "Optimism" }, dest: { symbol: "USDT", network: "Base" }, daysAgo: 16, apiKeyId: "pk-demo-1", hour: 14 },
  { amount: 1350, received: 1348.8, source: { symbol: "USDT", network: "Berachain" }, dest: { symbol: "USDC", network: "Ethereum" }, daysAgo: 17, apiKeyId: "pk-demo-2", hour: 9 },
  { amount: 22000, received: 21988.6, source: { symbol: "USDC", network: "BNB Chain" }, dest: { symbol: "USDT", network: "Ethereum" }, daysAgo: 18, apiKeyId: "pk-demo-1", hour: 16 },
  { amount: 470, received: 469.3, source: { symbol: "USDT", network: "Monad" }, dest: { symbol: "USDC", network: "Base" }, daysAgo: 19, apiKeyId: "pk-demo-2", hour: 12 },
  { amount: 9800, received: 9795.1, source: { symbol: "USDC", network: "Avalanche" }, dest: { symbol: "USDT", network: "Arbitrum" }, daysAgo: 20, apiKeyId: "pk-demo-1", hour: 8 },
  { amount: 2600, received: 2598.4, source: { symbol: "USDT", network: "Base" }, dest: { symbol: "USDC", network: "Ethereum" }, daysAgo: 21, apiKeyId: "pk-demo-1", hour: 13 },
  { amount: 15500, received: 15493.7, source: { symbol: "USDC", network: "Arbitrum" }, dest: { symbol: "USDT", network: "Polygon" }, daysAgo: 22, apiKeyId: "pk-demo-1", hour: 11 },
  { amount: 930, received: 928.8, source: { symbol: "USDT", network: "Near" }, dest: { symbol: "USDC", network: "Near" }, daysAgo: 23, apiKeyId: "pk-demo-2", hour: 7 },
  { amount: 4100, received: 4098.05, source: { symbol: "USDC", network: "Tron" }, dest: { symbol: "USDT", network: "Ethereum" }, daysAgo: 24, apiKeyId: "pk-demo-2", hour: 18 },
  { amount: 7200, received: 7196.6, source: { symbol: "USDT", network: "Ethereum" }, dest: { symbol: "USDC", network: "Base" }, daysAgo: 25, apiKeyId: "pk-demo-1", hour: 10 },
  { amount: 360, received: 359.4, source: { symbol: "USDC", network: "Polygon" }, dest: { symbol: "USDT", network: "Optimism" }, daysAgo: 26, apiKeyId: "pk-demo-2", hour: 15 },
  { amount: 11000, received: 10999.98, source: { symbol: "USDT", network: "Base" }, dest: { symbol: "USDC", network: "Arbitrum" }, daysAgo: 27, apiKeyId: "pk-demo-1", hour: 11 },
  { amount: 5400, received: 5397.9, source: { symbol: "USDC", network: "Solana" }, dest: { symbol: "USDT", network: "Base" }, daysAgo: 28, apiKeyId: "pk-demo-1", hour: 9 },
  { amount: 1800, received: 1798.7, source: { symbol: "USDT", network: "Arbitrum" }, dest: { symbol: "USDC", network: "Ethereum" }, daysAgo: 29, apiKeyId: "pk-demo-2", hour: 14 },
  { amount: 30000, received: 29988.2, source: { symbol: "USDC", network: "Ethereum" }, dest: { symbol: "USDT", network: "BNB Chain" }, daysAgo: 32, apiKeyId: "pk-demo-1", hour: 12 },
];

function explorerUrl(network: string, address: string) {
  const key = network.toLowerCase();
  if (key.includes("base")) return `https://basescan.org/address/${address}`;
  if (key.includes("arbitrum")) return `https://arbiscan.io/address/${address}`;
  if (key.includes("optimism")) return `https://optimistic.etherscan.io/address/${address}`;
  if (key.includes("polygon")) return `https://polygonscan.com/address/${address}`;
  if (key.includes("bnb")) return `https://bscscan.com/address/${address}`;
  if (key.includes("avalanche")) return `https://snowscan.xyz/address/${address}`;
  if (key.includes("gnosis")) return `https://gnosisscan.io/address/${address}`;
  if (key.includes("solana")) return `https://solscan.io/account/${address}`;
  if (key.includes("near")) return `https://nearblocks.io/address/${address}`;
  if (key.includes("tron")) return `https://tronscan.org/#/address/${address}`;
  return `https://etherscan.io/address/${address}`;
}

export function getPartnerReports(): PartnerReports {
  const now = new Date();
  const rows = REPORT_SEEDS.map((seed, index) => {
    const time = new Date(now);
    time.setDate(now.getDate() - seed.daysAgo);
    time.setHours(seed.hour, 56, 0, 0);
    return {
      id: `rpt-${index + 1}`,
      apiKeyId: seed.apiKeyId,
      amount: seed.amount,
      received: seed.received,
      source: seed.source,
      dest: seed.dest,
      from: REPORT_FROM,
      to: REPORT_TO,
      fromUrl: explorerUrl(seed.source.network, REPORT_FROM),
      toUrl: explorerUrl(seed.dest.network, REPORT_TO),
      time: time.toISOString(),
    };
  });
  return { keys: REPORT_KEYS, rows };
}
