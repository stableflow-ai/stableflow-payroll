import type { IntentsToken } from "@/stores/intents-tokens";
import type { WalletChainKind } from "@/utils";
import type { ChainKind } from "@/wallet";
import { detectAddressKind } from "./batch-utils";

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

/**
 * TODO(api): POST /v1/pay/request with this body. Payer URL shape is
 * `/pay?request=:id`. Opening that URL has no payer UI this sprint.
 */
export function buildRequestPaymentPayload(input: {
  address: string;
  amount: string;
  destinationAsset: string;
  description: string;
  receivePrivately: boolean;
}) {
  return {
    address: input.address.trim(),
    amount: input.amount,
    destinationAsset: input.destinationAsset,
    description: input.description.trim() || undefined,
    receivePrivately: input.receivePrivately,
  };
}
