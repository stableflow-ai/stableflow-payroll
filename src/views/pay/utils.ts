import Big from "big.js";
import { format } from "date-fns";
import { ApiError } from "@/lib/api-error";
import type { IntentsToken } from "@/stores/intents-tokens";
import { isAddressValid, type WalletChainKind } from "@/utils";
import { EMAIL_PATTERN, EXPORT_FILENAME_STAMP } from "./config";

const USER_REJECTED_PATTERNS = [
  "user rejected",
  "user denied",
  "rejected the request",
  "request rejected",
  "action_rejected",
];

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function payoutNetworkToken(token: IntentsToken): { network: string; token: string } {
  return { network: token.blockchain, token: token.symbol };
}

export function notifyEmailParam(notify: boolean, email: string): string | undefined {
  const trimmed = email.trim();
  if (!notify || !isValidEmail(trimmed)) return undefined;
  return trimmed;
}

export function detectAddressChainKind(address: string): WalletChainKind | null {
  const raw = address.trim();
  if (!raw) return null;
  if (isAddressValid(raw, "evm")) return "evm";
  if (isAddressValid(raw, "tron")) return "tron";
  if (isAddressValid(raw, "solana")) return "solana";
  if (isAddressValid(raw, "near")) return "near";
  return null;
}

export function parsePositiveDecimal(raw: string, maxDecimals = 6): string | null {
  const cleaned = raw.replace(/,/g, "").trim();
  if (!cleaned) return null;
  const pattern = new RegExp(`^(0|[1-9]\\d*)(\\.\\d{0,${maxDecimals}})?$`);
  if (!pattern.test(cleaned)) return null;
  if (Number(cleaned) <= 0) return null;
  return cleaned;
}

export function isDryQuoteStale(input: {
  amountForQuote: string | null;
  debouncedAmountForQuote: string | null;
  isPlaceholderData: boolean;
  isPending: boolean;
  isFetching: boolean;
}): boolean {
  if (!input.amountForQuote) return false;
  const awaitingFirstFetch = input.isPending && input.isFetching;
  return (
    input.amountForQuote !== input.debouncedAmountForQuote
    || input.isPlaceholderData
    || awaitingFirstFetch
  );
}

function extractEmbeddedMessage(text: string): string | null {
  const start = text.indexOf("{");
  if (start >= 0) {
    try {
      const parsed = JSON.parse(text.slice(start)) as { message?: unknown };
      if (typeof parsed.message === "string" && parsed.message) return parsed.message;
      if (Array.isArray(parsed.message) && parsed.message.length > 0) {
        return parsed.message.map(String).join("; ");
      }
    } catch {
      // Truncated JSON
    }
  }
  const match = text.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (match) {
    try {
      return JSON.parse(`"${match[1]}"`) as string;
    } catch {
      return match[1];
    }
  }
  return null;
}

export function formatQuoteErrorMessage(error: unknown, decimals = 6): string {
  const raw = error instanceof ApiError
    ? error.message
    : error instanceof Error
      ? error.message
      : String(error ?? "");
  const text = raw || "Quote failed";
  const message = extractEmbeddedMessage(text) || text;
  const lower = message.toLowerCase();
  if (USER_REJECTED_PATTERNS.some((pattern) => lower.includes(pattern))) {
    return "User rejected transaction";
  }
  const amountTooLow = message.match(/Amount is too low for bridge,\s*try at least\s+(\d+(?:\.\d+)?)/i);
  if (amountTooLow) {
    try {
      const humanAmount = Big(amountTooLow[1]).div(Big(10).pow(decimals)).toFixed();
      return `Amount is too low for bridge, try at least ${humanAmount}`;
    } catch {
      return "Amount is too low for bridge";
    }
  }
  if (/No liquidity available/i.test(message)) return "No liquidity available";
  if (message.length > 80 || /Cross-chain quote failed/i.test(message)) return "Quote failed";
  return message;
}

export function paymentRowId(row: { id: string; recipient: string; submittedAt: string }, index: number) {
  return row.id || [row.recipient, row.submittedAt, index].join("|");
}

export function paymentDisplayAmount(item: {
  destinationAmount: string;
  amount: string;
}) {
  return item.destinationAmount || item.amount;
}

export function paymentDisplayToken(item: {
  destinationToken: string;
  token: string;
}) {
  return item.destinationToken || item.token;
}

export function paymentDisplayNetwork(item: {
  destinationNetwork: string;
  network: string;
}) {
  return item.destinationNetwork || item.network;
}

export function stampDownloadFilename(filename: string, now = new Date()): string {
  const stamp = format(now, EXPORT_FILENAME_STAMP);
  const dot = filename.lastIndexOf(".");
  if (dot <= 0) return `${filename}-${stamp}`;
  return `${filename.slice(0, dot)}-${stamp}${filename.slice(dot)}`;
}
