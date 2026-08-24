import { tokenLogoUrl } from "@/lib/logo";
import type { ChainKind } from "@/wallet";

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
  blockchain: string;
  chainKind: ChainKind;
  receivedAt: string;
  address: string;
  private: boolean;
  status: ReceivedStatus;
};

export type RequestPaymentFixture = {
  received: ReceivedPayment[];
};

const RECEIVED: ReceivedPayment[] = [
  {
    id: "req-1",
    amount: "0.02",
    symbol: "USDC",
    network: "BNB Chain",
    blockchain: "bsc",
    chainKind: "evm",
    receivedAt: "2026-08-20T08:51:55.754Z",
    address: "0x635fa4477c7f9681a4ac88fa6147f441114e8655",
    private: true,
    status: RECEIVED_STATUS.Withdraw,
  },
  {
    id: "req-2",
    amount: "250",
    symbol: "USDT",
    network: "Ethereum",
    blockchain: "eth",
    chainKind: "evm",
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
    blockchain: "base",
    chainKind: "evm",
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
    blockchain: "sol",
    chainKind: "solana",
    receivedAt: "2026-08-10T16:40:00.000Z",
    address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    private: true,
    status: RECEIVED_STATUS.Withdraw,
  },
];

export function receivedTokenLogo(symbol: ReceivedPayment["symbol"]): string {
  return tokenLogoUrl(symbol);
}

export function getReceivedPayments(): ReceivedPayment[] {
  return RECEIVED;
}

export function getPendingWithdrawCount(): number {
  return RECEIVED.filter((row) => row.status === RECEIVED_STATUS.Withdraw).length;
}

export function getRequestPayment(): RequestPaymentFixture {
  return { received: getReceivedPayments() };
}
