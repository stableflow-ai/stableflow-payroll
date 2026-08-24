import { tokenLogoUrl } from "@/lib/logo";

export const RECEIVED_STATUS = {
  Withdraw: "withdraw",
  Withdrawed: "withdrawed",
  Received: "received",
} as const;

export type ReceivedStatus = (typeof RECEIVED_STATUS)[keyof typeof RECEIVED_STATUS];

export type ReceivedPayment = {
  id: string;
  amount: string;
  symbol: "USDC" | "USDT";
  network: string;
  receivedAt: string;
  address: string;
  private: boolean;
  status: ReceivedStatus;
};

export type RequestPaymentFixture = {
  received: ReceivedPayment[];
  pendingWithdrawCount: number;
};

const RECEIVED: ReceivedPayment[] = [
  {
    id: "req-1",
    amount: "1000",
    symbol: "USDC",
    network: "Arbitrum",
    receivedAt: "2026-08-20T08:51:55.754Z",
    address: "0x541aaaaaaaaaaaaaaaaaaaaaaaaaaa38Dc1",
    private: true,
    status: RECEIVED_STATUS.Withdraw,
  },
  {
    id: "req-2",
    amount: "250",
    symbol: "USDT",
    network: "Ethereum",
    receivedAt: "2026-08-18T14:20:00.000Z",
    address: "0x541aaaaaaaaaaaaaaaaaaaaaaaaaaa38Dc1",
    private: true,
    status: RECEIVED_STATUS.Withdrawed,
  },
  {
    id: "req-3",
    amount: "80",
    symbol: "USDC",
    network: "Base",
    receivedAt: "2026-08-12T11:05:00.000Z",
    address: "0x541aaaaaaaaaaaaaaaaaaaaaaaaaaa38Dc1",
    private: false,
    status: RECEIVED_STATUS.Received,
  },
  {
    id: "req-4",
    amount: "420.5",
    symbol: "USDC",
    network: "Solana",
    receivedAt: "2026-08-10T16:40:00.000Z",
    address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    private: true,
    status: RECEIVED_STATUS.Withdraw,
  },
];

export function receivedTokenLogo(symbol: ReceivedPayment["symbol"]): string {
  return tokenLogoUrl(symbol);
}

export function getRequestPayment(): RequestPaymentFixture {
  const pendingWithdrawCount = RECEIVED.filter((row) => row.status === RECEIVED_STATUS.Withdraw).length;
  return { received: RECEIVED, pendingWithdrawCount };
}
