import { getChainByNetwork, txExplorerUrl } from "@/config/chains";
import type { PaySingleQuoteParam } from "@/types/payout";
import type {
  PaymentRequestDefaultAddress,
  PaymentRequestItem,
} from "@/types/request-payment";
import type { IntentsToken, PayoutSymbol } from "@/stores/intents-tokens";
import { normalizeSymbol } from "@/stores/intents-tokens";
import { formatAmount, type WalletChainKind } from "@/utils";
import type { ChainKind } from "@/wallet";
import { detectAddressKind } from "./batch-utils";
import { PAY_FORM_PATH, PAY_REQUEST_STATUS, PAY_REQUEST_STATUS_CLASS } from "./config";
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

export function buildPaymentRequestUrl(origin: string, batchId: number): string {
  const base = origin.replace(/\/+$/, "");
  return `${base}${PAY_FORM_PATH}?batch_id=${batchId}`;
}

export function defaultAddressForNetwork(
  addresses: readonly PaymentRequestDefaultAddress[],
  network: string | null | undefined,
): string | null {
  const target = getChainByNetwork(network ?? "");
  const keys = new Set(
    [network, target?.blockchain, target?.chainName]
      .map((value) => String(value ?? "").trim().toLowerCase())
      .filter(Boolean),
  );
  if (!keys.size) return null;
  const match = addresses.find((item) => {
    const chain = getChainByNetwork(item.network);
    const itemKeys = [item.network, chain?.blockchain, chain?.chainName]
      .map((value) => String(value ?? "").trim().toLowerCase())
      .filter(Boolean);
    return itemKeys.some((key) => keys.has(key));
  });
  const address = match?.address.trim() ?? "";
  return address || null;
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
  symbol: PayoutSymbol;
  network: string;
  blockchain: string;
  chainKind: ChainKind;
  createdAt: string;
  address: string;
  paidAddress: string;
  paidAt: string;
  completedTxHash: string;
  status: string;
};

export function toReceivedPaymentView(item: PaymentRequestItem): ReceivedPaymentView {
  const chain = getChainByNetwork(item.network);
  const token = item.symbol.toUpperCase();
  const symbol = normalizeSymbol(token) ?? "USDC";
  const chainKind = chain?.chainKind
    ?? detectAddressChainKind(item.recipient)
    ?? "evm";
  return {
    id: item.batchId,
    paymentName: item.purpose,
    amount: item.amount,
    symbol,
    network: chain?.chainName ?? item.network,
    blockchain: chain?.blockchain ?? item.network,
    chainKind,
    createdAt: item.createdAt,
    address: item.recipient,
    paidAddress: item.payer,
    paidAt: item.paidAt,
    completedTxHash: item.destinationTxHash,
    status: item.status,
  };
}

const PENDING_STATUSES = new Set<string>([
  PAY_REQUEST_STATUS.Pending,
  PAY_REQUEST_STATUS.Created,
  PAY_REQUEST_STATUS.Processing,
  PAY_REQUEST_STATUS.Submitted,
]);

const FAILED_STATUSES = new Set<string>([
  PAY_REQUEST_STATUS.Failed,
  PAY_REQUEST_STATUS.Expired,
]);

export function receivedPaymentStatusLabel(row: ReceivedPaymentView): string {
  if (row.status === PAY_REQUEST_STATUS.Completed) return "Complete";
  if (PENDING_STATUSES.has(row.status)) return "Pending";
  if (FAILED_STATUSES.has(row.status)) return "Failed";
  return row.status;
}

export function receivedPaymentStatusClass(status: string): string {
  if (status === PAY_REQUEST_STATUS.Completed) {
    return PAY_REQUEST_STATUS_CLASS[PAY_REQUEST_STATUS.Completed];
  }
  if (FAILED_STATUSES.has(status)) return PAY_REQUEST_STATUS_CLASS[PAY_REQUEST_STATUS.Failed];
  if (PENDING_STATUSES.has(status)) return PAY_REQUEST_STATUS_CLASS[PAY_REQUEST_STATUS.Pending];
  return "text-[#aaa]";
}

export function requestStatusExplorerUrl(row: ReceivedPaymentView): string | null {
  return txExplorerUrl(row.blockchain, row.completedTxHash);
}

export function formatCouponAmount(amount: string): { whole: string; fraction?: string } {
  const formatted = formatAmount(amount, { prefix: "", maxDecimals: 6, padDecimals: false });
  const [whole, fraction] = formatted.split(".");
  return { whole, fraction };
}

export function truncateMiddle(text: string, prefix = 5, suffix = 6): string {
  if (text.length <= prefix + suffix) return text;
  return `${text.slice(0, prefix)}...${text.slice(-suffix)}`;
}
