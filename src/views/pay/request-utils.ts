import { getChainByNetwork, txExplorerUrl } from "@/config/chains";
import type { PaySingleQuoteParam } from "@/types/payout";
import type { PayRequestItem } from "@/types/request-payment";
import type { IntentsToken } from "@/stores/intents-tokens";
import { formatAmount, type WalletChainKind } from "@/utils";
import type { ChainKind } from "@/wallet";
import { detectAddressKind } from "./batch-utils";
import {
  PAY_REQUEST_MODE,
  PAY_REQUEST_STATUS,
} from "./config";
import { detectAddressChainKind } from "./utils";

const USER_REJECTED_PATTERNS = [
  "user rejected",
  "user denied",
  "rejected the request",
  "request rejected",
  "action_rejected",
];

export function tokenChainKind(token: IntentsToken | null | undefined): ChainKind | null {
  const kind = token?.chain.chainKind;
  if (kind === "evm" || kind === "near" || kind === "solana" || kind === "tron") return kind;
  return null;
}

export function receivingAddressError(
  address: string,
  tokenKind: WalletChainKind | null,
): string | null {
  const detected = detectAddressKind(address);
  if (detected.error) return detected.error;
  if (tokenKind && detected.chainKind !== tokenKind) {
    return "Token network does not match address type";
  }
  return null;
}

export function isUserRejectedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const lower = message.toLowerCase();
  return USER_REJECTED_PATTERNS.some((pattern) => lower.includes(pattern));
}

export function activateErrorMessage(error: unknown, fallback: string): string {
  if (isUserRejectedError(error)) return "Signature rejected";
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function parsePaymentRequestId(raw: string | undefined | null): number | null {
  const id = Number.parseInt(String(raw ?? "").trim(), 10);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

export function buildPaymentRequestUrl(origin: string, id: number): string {
  const base = origin.replace(/\/+$/, "");
  return `${base}/p/${id}`;
}

export function applyRequestPayoutFields(
  body: PaySingleQuoteParam,
  requestId: number,
): PaySingleQuoteParam {
  return { ...body, request_id: requestId };
}

export type ReceivedPaymentView = {
  id: number;
  paymentName: string;
  amount: string;
  symbol: "USDC" | "USDT";
  network: string;
  blockchain: string;
  chainKind: ChainKind;
  createdAt: string;
  address: string;
  paidAddress: string;
  paidAt: string;
  completedTxHash: string;
  withdrawedTxHash: string;
  private: boolean;
  status: string;
};

export function canWithdrawRequest(row: Pick<ReceivedPaymentView, "private" | "status">): boolean {
  return row.private && row.status === PAY_REQUEST_STATUS.Completed;
}

export function pendingWithdrawCount(items: readonly PayRequestItem[]): number {
  return items.filter(
    (row) => row.mode === PAY_REQUEST_MODE.Private && row.status === PAY_REQUEST_STATUS.Completed,
  ).length;
}

export function toReceivedPaymentView(item: PayRequestItem): ReceivedPaymentView {
  const chain = getChainByNetwork(item.network);
  const token = item.token.toUpperCase();
  const symbol = token === "USDT" ? "USDT" : "USDC";
  const chainKind = chain?.chainKind
    ?? detectAddressChainKind(item.recipient_address)
    ?? "evm";
  return {
    id: item.id,
    paymentName: item.name,
    amount: item.amount,
    symbol,
    network: chain?.chainName ?? item.network,
    blockchain: chain?.blockchain ?? item.network,
    chainKind,
    createdAt: item.created_at,
    address: item.recipient_address,
    paidAddress: item.payer,
    paidAt: item.paid_at,
    completedTxHash: item.destination_tx_hash,
    withdrawedTxHash: item.withdraw_tx_hash,
    private: item.mode === PAY_REQUEST_MODE.Private,
    status: item.status,
  };
}

export function receivedPaymentStatusLabel(row: ReceivedPaymentView): string {
  if (row.status === PAY_REQUEST_STATUS.Completed) return "Received";
  if (row.status === PAY_REQUEST_STATUS.Withdrawed) return "Withdrawed";
  if (row.status === PAY_REQUEST_STATUS.Withdrawing) return "Withdrawing";
  if (row.status === PAY_REQUEST_STATUS.Pending) return "Pending";
  if (row.status === PAY_REQUEST_STATUS.Submitted) return "Submitted";
  if (row.status === PAY_REQUEST_STATUS.Failed) return "Failed";
  return row.status;
}

export function requestStatusExplorerUrl(row: ReceivedPaymentView): string | null {
  if (row.status === PAY_REQUEST_STATUS.Withdrawed) {
    return txExplorerUrl(row.blockchain, row.withdrawedTxHash);
  }
  if (!row.private && row.status === PAY_REQUEST_STATUS.Completed) {
    return txExplorerUrl(row.blockchain, row.completedTxHash);
  }
  return null;
}

export function formatCouponAmount(amount: string): { whole: string; fraction: string } {
  const formatted = formatAmount(amount, { prefix: "", maxDecimals: 6, padDecimals: false });
  const [whole, fraction] = formatted.split(".");
  return { whole, fraction };
}

export function truncateMiddle(text: string, prefix = 5, suffix = 6): string {
  if (text.length <= prefix + suffix) return text;
  return `${text.slice(0, prefix)}...${text.slice(-suffix)}`;
}
