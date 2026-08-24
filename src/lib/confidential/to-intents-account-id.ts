import bs58 from "bs58";
import { TronWeb } from "tronweb";
import type { ChainKind } from "@/wallet";

const EVM_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Convert a chain address into the NEAR Intents account id.
 * Aligns with `@defuse-protocol/internal-utils` `authHandleToIntentsUserId`.
 */
export function toIntentsAccountId(address: string, chainKind: ChainKind): string {
  const value = address.trim();
  if (!value) throw new Error("Invalid wallet address");

  if (chainKind === "evm") {
    if (!EVM_ADDRESS_PATTERN.test(value)) throw new Error("Invalid EVM wallet address");
    return value.toLowerCase();
  }

  if (chainKind === "near") {
    return value.toLowerCase();
  }

  if (chainKind === "solana") {
    const decoded = bs58.decode(value);
    if (decoded.length !== 32) throw new Error("Invalid Solana wallet address");
    return bytesToHex(decoded);
  }

  if (chainKind === "tron") {
    const hex = TronWeb.address.toHex(value).replace(/^0x/i, "");
    const body = hex.toLowerCase().startsWith("41") ? hex.slice(2) : hex;
    if (body.length !== 40) throw new Error("Invalid Tron wallet address");
    return `0x${body.toLowerCase()}`;
  }

  throw new Error("Unsupported chain");
}
