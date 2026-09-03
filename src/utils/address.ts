/**
 * Address validation for EVM, Near, Solana, and Tron.
 * Near follows near-sdk-js / Nomicon account ID rules.
 * Solana also checks 32-byte base58 decode. Tron uses TronWeb.isAddress.
 */

import { TronWeb } from "tronweb";
import { getAddress, isAddress } from "viem";
import { getChainByNetwork } from "@/config/chains";
import type { ChainKind } from "@/wallet/types";

export type WalletChainKind = ChainKind;

export interface AddressValidationResult {
  isValid: boolean;
  error?: string;
}

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/** Nomicon / near-sdk-js account ID pattern (length is checked separately). */
const NEAR_ACCOUNT_ID_REGEX =
  /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/;

function decodeBase58(input: string): Uint8Array | null {
  if (!input) return null;
  let zeros = 0;
  while (zeros < input.length && input[zeros] === "1") zeros++;
  const size = Math.ceil(input.length * 0.733);
  const bytes = new Uint8Array(size);
  let length = 0;
  for (let i = zeros; i < input.length; i++) {
    let carry = BASE58_ALPHABET.indexOf(input[i]);
    if (carry < 0) return null;
    for (let j = 0; j < length; j++) {
      carry += bytes[size - 1 - j] * 58;
      bytes[size - 1 - j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes[size - 1 - length] = carry & 0xff;
      length++;
      carry >>= 8;
    }
  }
  const out = new Uint8Array(zeros + length);
  for (let i = 0; i < length; i++) out[zeros + i] = bytes[size - length + i];
  return out;
}

export function resolveChainKind(networkOrKind: string | null | undefined): WalletChainKind | null {
  const raw = String(networkOrKind || "").trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower === "evm" || lower === "near" || lower === "solana" || lower === "tron") return lower;
  if (lower === "sol") return "solana";
  if (lower === "trx") return "tron";
  const chain = getChainByNetwork(raw);
  if (!chain) return null;
  return chain.chainKind;
}

function validateEvmAddress(address: string): AddressValidationResult {
  if (!isAddress(address)) {
    return { isValid: false, error: "Invalid EVM address" };
  }
  return { isValid: true };
}

function validateNearAddress(address: string): AddressValidationResult {
  const isValid =
    address.length >= 2 &&
    address.length <= 64 &&
    NEAR_ACCOUNT_ID_REGEX.test(address);
  if (!isValid) return { isValid: false, error: "Invalid NEAR address" };
  return { isValid: true };
}

function validateSolanaAddress(address: string): AddressValidationResult {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
    return { isValid: false, error: "Invalid Solana address" };
  }
  const decoded = decodeBase58(address);
  if (!decoded || decoded.length !== 32) {
    return { isValid: false, error: "Invalid Solana address" };
  }
  return { isValid: true };
}

function validateTronAddress(address: string): AddressValidationResult {
  if (!TronWeb.isAddress(address)) {
    return { isValid: false, error: "Invalid Tron address" };
  }
  return { isValid: true };
}

export function validateAddress(
  address: string,
  chainKind: WalletChainKind | string | null | undefined,
): AddressValidationResult {
  const trimmed = String(address || "").trim();
  if (!trimmed) return { isValid: false, error: "Address cannot be empty" };
  const kind = resolveChainKind(chainKind);
  if (!kind) return { isValid: false, error: "Unsupported network" };
  if (kind === "evm") return validateEvmAddress(trimmed);
  if (kind === "near") return validateNearAddress(trimmed);
  if (kind === "tron") return validateTronAddress(trimmed);
  return validateSolanaAddress(trimmed);
}

export function isAddressValid(
  address: string,
  chainKind: WalletChainKind | string | null | undefined,
): boolean {
  return validateAddress(address, chainKind).isValid;
}

export function normalizeAddress(
  address: string,
  chainKind: WalletChainKind | string | null | undefined,
): string | null {
  const trimmed = String(address || "").trim();
  const kind = resolveChainKind(chainKind);
  if (!kind || !validateAddress(trimmed, kind).isValid) return null;
  if (kind === "evm") return getAddress(trimmed);
  if (kind === "near") return trimmed.toLowerCase();
  return trimmed;
}

export function sameAddress(
  a: string | null | undefined,
  b: string | null | undefined,
  chainKind?: WalletChainKind | string | null,
): boolean {
  if (!a || !b) return false;
  const kind = resolveChainKind(chainKind);
  if (kind === "solana" || kind === "tron") return a.trim() === b.trim();
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function getAddressPlaceholder(chainKind: WalletChainKind | string | null | undefined): string {
  const kind = resolveChainKind(chainKind);
  if (kind === "near") return "alice.near";
  if (kind === "solana") return "Solana address";
  if (kind === "tron") return "T…";
  return "0x…";
}

export function formatAddress(
  address: string | null | undefined,
  prefix = 4,
  suffix = 5,
): string {
  if (!address) return "";
  if (!address.startsWith("0x") && address.length <= 32) return address;
  if (address.length <= prefix + suffix) return address;
  return `${address.slice(0, prefix)}...${address.slice(-suffix)}`;
}
