import { nearViewFunction } from "@/lib/rpc/near";
import { INTENTS_RECIPIENT } from "@/wallet/intents-sign";
import {
  INTENTS_SALT_METHOD,
  INTENTS_SALT_TTL_MS,
  VERSIONED_NONCE_MAGIC,
  VERSIONED_NONCE_RANDOM_LENGTH,
  VERSIONED_NONCE_VERSION,
} from "./config";

let cachedSalt: { bytes: Uint8Array; fetchedAt: number } | null = null;
let inflightSalt: Promise<Uint8Array> | null = null;

export function parseSaltHex(hex: string): Uint8Array {
  const clean = hex.trim().replace(/^0x/i, "");
  if (clean.length !== 8 || !/^[0-9a-fA-F]+$/.test(clean)) {
    throw new Error("intents.near current_salt must be a 4-byte hex string");
  }
  const bytes = new Uint8Array(4);
  for (let i = 0; i < 4; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function msToNanoseconds(ms: number): bigint {
  return BigInt(Math.floor(ms)) * 1_000_000n;
}

function writeU64Le(target: Uint8Array, offset: number, value: bigint): void {
  const view = new DataView(target.buffer, target.byteOffset, target.byteLength);
  view.setBigUint64(offset, value, true);
}

/**
 * 15-byte auth random part: start time as LE nanoseconds + 7 random bytes.
 * Matches `VersionedNonceBuilder.createTimestampedNonceBytes`.
 */
export function createTimestampedRandomBytes(startMs: number): Uint8Array {
  const bytes = new Uint8Array(VERSIONED_NONCE_RANDOM_LENGTH);
  writeU64Le(bytes, 0, msToNanoseconds(startMs));
  crypto.getRandomValues(bytes.subarray(8));
  return bytes;
}

/**
 * 32-byte V1 nonce: magic(4) + version(1) + salt(4) + deadline ns LE(8) + random(15).
 */
export function encodeVersionedNonce(input: {
  salt: Uint8Array;
  deadlineMs: number;
  randomBytes?: Uint8Array;
}): Uint8Array {
  const randomBytes = input.randomBytes
    ?? crypto.getRandomValues(new Uint8Array(VERSIONED_NONCE_RANDOM_LENGTH));
  if (input.salt.length !== 4) {
    throw new Error("Intents salt must be 4 bytes");
  }
  if (randomBytes.length !== VERSIONED_NONCE_RANDOM_LENGTH) {
    throw new Error(`Nonce random bytes must be ${VERSIONED_NONCE_RANDOM_LENGTH} bytes`);
  }

  const result = new Uint8Array(32);
  result.set(VERSIONED_NONCE_MAGIC, 0);
  result[4] = VERSIONED_NONCE_VERSION;
  result.set(input.salt, 5);
  writeU64Le(result, 9, msToNanoseconds(input.deadlineMs));
  result.set(randomBytes, 17);
  return result;
}

export function createAuthNonce(
  salt: Uint8Array,
  deadlineMs: number,
  startMs = Date.now(),
): Uint8Array {
  return encodeVersionedNonce({
    salt,
    deadlineMs,
    randomBytes: createTimestampedRandomBytes(startMs),
  });
}

async function fetchIntentsSalt(): Promise<Uint8Array> {
  const value = await nearViewFunction<string>(INTENTS_RECIPIENT, INTENTS_SALT_METHOD, {});
  if (typeof value !== "string" || !value) {
    throw new Error("Failed to fetch intents.near current_salt");
  }
  const bytes = parseSaltHex(value);
  cachedSalt = { bytes, fetchedAt: Date.now() };
  return bytes;
}

export async function getIntentsContractSalt(): Promise<Uint8Array> {
  if (cachedSalt && Date.now() - cachedSalt.fetchedAt < INTENTS_SALT_TTL_MS) {
    return cachedSalt.bytes;
  }
  if (inflightSalt) return inflightSalt;
  inflightSalt = fetchIntentsSalt().finally(() => {
    inflightSalt = null;
  });
  return inflightSalt;
}

export function resetIntentsSaltCache(): void {
  cachedSalt = null;
  inflightSalt = null;
}
