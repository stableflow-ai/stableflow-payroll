import type { IntentsToken } from "@/stores/intents-tokens";
import { toIntentsAccountId } from "@/lib/confidential/to-intents-account-id";
import type { PaySingleQuoteParam } from "@/types/payout";
import type { WalletChainKind } from "@/utils";
import type { ChainKind } from "@/wallet";
import { detectAddressKind } from "./batch-utils";
import {
  AMOUNT_MAX_DECIMALS,
  PAYMENT_REQUEST_PRIVATE_VALUE,
  PAYMENT_REQUEST_QUERY,
} from "./config";
import { parsePositiveDecimal } from "./utils";

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

export type PaymentRequestSearch = {
  addr: string;
  amount: string;
  token: "USDC" | "USDT";
  network: string;
  uid: number;
  memo?: string;
  receivePrivately: boolean;
};

export function buildPaymentRequestSearch(input: {
  address: string;
  amount: string;
  token: "USDC" | "USDT";
  network: string;
  uid: number;
  memo?: string;
  receivePrivately: boolean;
}): string {
  const params = new URLSearchParams();
  params.set(PAYMENT_REQUEST_QUERY.Addr, input.address.trim());
  params.set(PAYMENT_REQUEST_QUERY.Amount, input.amount);
  params.set(PAYMENT_REQUEST_QUERY.Token, input.token);
  params.set(PAYMENT_REQUEST_QUERY.Network, input.network);
  params.set(PAYMENT_REQUEST_QUERY.Uid, String(input.uid));
  const memo = input.memo?.trim();
  if (memo) params.set(PAYMENT_REQUEST_QUERY.Memo, memo);
  if (input.receivePrivately) {
    params.set(PAYMENT_REQUEST_QUERY.Private, PAYMENT_REQUEST_PRIVATE_VALUE);
  }
  return params.toString();
}

export function buildPaymentRequestUrl(
  origin: string,
  input: Parameters<typeof buildPaymentRequestSearch>[0],
): string {
  const base = origin.replace(/\/+$/, "");
  return `${base}/pay?${buildPaymentRequestSearch(input)}`;
}

export function parsePaymentRequestSearch(search: string): PaymentRequestSearch | null {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  if (!raw) return null;
  const params = new URLSearchParams(raw);
  const addr = params.get(PAYMENT_REQUEST_QUERY.Addr)?.trim() ?? "";
  const amount = parsePositiveDecimal(
    params.get(PAYMENT_REQUEST_QUERY.Amount) ?? "",
    AMOUNT_MAX_DECIMALS,
  );
  const tokenRaw = (params.get(PAYMENT_REQUEST_QUERY.Token) ?? "").toUpperCase();
  const token = tokenRaw === "USDC" || tokenRaw === "USDT" ? tokenRaw : null;
  const network = params.get(PAYMENT_REQUEST_QUERY.Network)?.trim() ?? "";
  const uid = Number.parseInt(params.get(PAYMENT_REQUEST_QUERY.Uid)?.trim() ?? "", 10);
  const memo = params.get(PAYMENT_REQUEST_QUERY.Memo)?.trim() || undefined;
  const receivePrivately = params.get(PAYMENT_REQUEST_QUERY.Private) === PAYMENT_REQUEST_PRIVATE_VALUE;
  if (!addr || !amount || !token || !network || !Number.isInteger(uid) || uid <= 0) {
    return null;
  }
  return { addr, amount, token, network, uid, memo, receivePrivately };
}

export function applyRequestPayoutFields(
  body: PaySingleQuoteParam,
  request: PaymentRequestSearch,
  destKind: ChainKind,
): PaySingleQuoteParam {
  const next: PaySingleQuoteParam = { ...body, request_user_id: request.uid };
  if (request.receivePrivately) {
    next.mode = "private";
    next.privateDestinationAddress = toIntentsAccountId(request.addr, destKind);
  }
  return next;
}
