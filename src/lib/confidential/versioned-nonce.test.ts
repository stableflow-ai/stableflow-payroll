import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nearViewFunction } from "@/lib/rpc/near";
import { INTENTS_RECIPIENT } from "@/wallet/intents-sign";
import {
  INTENTS_SALT_METHOD,
  VERSIONED_NONCE_MAGIC,
  VERSIONED_NONCE_VERSION,
} from "./config";
import {
  createAuthNonce,
  createTimestampedRandomBytes,
  encodeVersionedNonce,
  getIntentsContractSalt,
  msToNanoseconds,
  parseSaltHex,
  resetIntentsSaltCache,
} from "./versioned-nonce";

vi.mock("@/lib/rpc/near", () => ({
  nearViewFunction: vi.fn(),
}));

function readU64Le(bytes: Uint8Array, offset: number): bigint {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getBigUint64(offset, true);
}

describe("parseSaltHex", () => {
  it("decodes a 4-byte hex salt", () => {
    expect(Array.from(parseSaltHex("252812b3"))).toEqual([0x25, 0x28, 0x12, 0xb3]);
  });

  it("accepts a 0x prefix", () => {
    expect(Array.from(parseSaltHex("0x252812b3"))).toEqual([0x25, 0x28, 0x12, 0xb3]);
  });

  it("rejects the wrong length", () => {
    expect(() => parseSaltHex("25")).toThrow(/4-byte hex/);
  });
});

describe("encodeVersionedNonce", () => {
  const salt = parseSaltHex("252812b3");
  const deadlineMs = Date.parse("2026-08-24T02:52:29.996Z");
  const randomBytes = Uint8Array.from({ length: 15 }, (_, i) => i + 1);

  it("writes the 32-byte V1 layout", () => {
    const nonce = encodeVersionedNonce({ salt, deadlineMs, randomBytes });
    expect(nonce.length).toBe(32);
    expect(Array.from(nonce.subarray(0, 4))).toEqual(Array.from(VERSIONED_NONCE_MAGIC));
    expect(nonce[4]).toBe(VERSIONED_NONCE_VERSION);
    expect(Array.from(nonce.subarray(5, 9))).toEqual(Array.from(salt));
    expect(readU64Le(nonce, 9)).toBe(msToNanoseconds(deadlineMs));
    expect(Array.from(nonce.subarray(17))).toEqual(Array.from(randomBytes));
  });

  it("matches the 1Click docs magic prefix in base64", () => {
    const nonce = encodeVersionedNonce({ salt, deadlineMs, randomBytes });
    expect(Buffer.from(nonce).toString("base64").startsWith("Vij2xg")).toBe(true);
  });
});

describe("createAuthNonce", () => {
  it("embeds the start time in the inner 15 bytes", () => {
    const salt = parseSaltHex("252812b3");
    const deadlineMs = Date.parse("2026-08-24T02:52:29.996Z");
    const startMs = Date.parse("2026-08-24T02:47:41.784Z");
    const nonce = createAuthNonce(salt, deadlineMs, startMs);
    expect(readU64Le(nonce, 9)).toBe(msToNanoseconds(deadlineMs));
    expect(readU64Le(nonce, 17)).toBe(msToNanoseconds(startMs));
  });
});

describe("createTimestampedRandomBytes", () => {
  it("is 15 bytes with LE nanosecond start time", () => {
    const startMs = 1_777_000_000_000;
    const bytes = createTimestampedRandomBytes(startMs);
    expect(bytes.length).toBe(15);
    expect(readU64Le(bytes, 0)).toBe(msToNanoseconds(startMs));
  });
});

describe("getIntentsContractSalt", () => {
  beforeEach(() => {
    resetIntentsSaltCache();
    vi.mocked(nearViewFunction).mockReset();
  });

  afterEach(() => {
    resetIntentsSaltCache();
  });

  it("fetches current_salt and caches it", async () => {
    vi.mocked(nearViewFunction).mockResolvedValue("252812b3");
    const first = await getIntentsContractSalt();
    const second = await getIntentsContractSalt();
    expect(Array.from(first)).toEqual([0x25, 0x28, 0x12, 0xb3]);
    expect(second).toBe(first);
    expect(nearViewFunction).toHaveBeenCalledTimes(1);
    expect(nearViewFunction).toHaveBeenCalledWith(INTENTS_RECIPIENT, INTENTS_SALT_METHOD, {});
  });
});
