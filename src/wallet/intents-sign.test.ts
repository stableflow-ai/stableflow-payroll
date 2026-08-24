import { describe, expect, it } from "vitest";
import bs58 from "bs58";
import { encodeEd25519, encodeSecp256k1Signature } from "./intents-sign";

describe("encodeSecp256k1Signature", () => {
  it("normalizes v from 27 to 0 and prefixes secp256k1", () => {
    const r = "11".repeat(32);
    const s = "22".repeat(32);
    const encoded = encodeSecp256k1Signature(`0x${r}${s}1b`);
    expect(encoded.startsWith("secp256k1:")).toBe(true);
    const bytes = bs58.decode(encoded.slice("secp256k1:".length));
    expect(bytes.length).toBe(65);
    expect(bytes[64]).toBe(0);
  });

  it("keeps v already in {0,1}", () => {
    const r = "aa".repeat(32);
    const s = "bb".repeat(32);
    const encoded = encodeSecp256k1Signature(`${r}${s}01`);
    const bytes = bs58.decode(encoded.slice("secp256k1:".length));
    expect(bytes[64]).toBe(1);
  });
});

describe("encodeEd25519", () => {
  it("prefixes raw bytes", () => {
    const bytes = new Uint8Array(32).fill(7);
    expect(encodeEd25519(bytes)).toBe(`ed25519:${bs58.encode(bytes)}`);
  });

  it("keeps an existing ed25519 prefix", () => {
    expect(encodeEd25519("ed25519:abc")).toBe("ed25519:abc");
  });
});
