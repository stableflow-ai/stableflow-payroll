import { getChainByNetwork } from "@/config/chains";
import type { PaySingleQuoteParam } from "@/types/payout";
import type { PayRequestItem } from "@/types/request-payment";
import type { IntentsToken } from "@/stores/intents-tokens";
import type { WalletChainKind } from "@/utils";
import type { ChainKind } from "@/wallet";
import { detectAddressKind } from "./batch-utils";
import {
  PAY_REQUEST_MODE,
  PAY_REQUEST_STATUS,
  PAYMENT_REQUEST_QUERY,
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

export function parsePaymentRequestId(search: string): number | null {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  if (!raw) return null;
  const params = new URLSearchParams(raw);
  const id = Number.parseInt(params.get(PAYMENT_REQUEST_QUERY.Id)?.trim() ?? "", 10);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

export function buildPaymentRequestUrl(origin: string, id: number): string {
  const base = origin.replace(/\/+$/, "");
  return `${base}/pay?${PAYMENT_REQUEST_QUERY.Id}=${id}`;
}

export function applyRequestPayoutFields(
  body: PaySingleQuoteParam,
  requestId: number,
): PaySingleQuoteParam {
  return { ...body, request_id: requestId };
}

export type ReceivedPaymentView = {
  id: number;
  amount: string;
  symbol: "USDC" | "USDT";
  network: string;
  blockchain: string;
  chainKind: ChainKind;
  createdAt: string;
  address: string;
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
    amount: item.amount,
    symbol,
    network: chain?.chainName ?? item.network,
    blockchain: chain?.blockchain ?? item.network,
    chainKind,
    createdAt: item.created_at,
    address: item.recipient_address,
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
