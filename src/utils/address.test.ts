import { describe, expect, it } from "vitest";
import { formatAddress, isAddressValid, sameAddress, validateAddress } from "./address";

describe("address validation", () => {
  it("accepts checksum EVM addresses", () => {
    expect(isAddressValid("0x1111111111111111111111111111111111111111", "evm")).toBe(true);
  });

  it("accepts named Near accounts, hyphen labels, DAO accounts, and implicit hex", () => {
    expect(isAddressValid("alice.near", "near")).toBe(true);
    expect(isAddressValid("a-b.near", "near")).toBe(true);
    expect(isAddressValid("burrow.sputnik-dao.near", "near")).toBe(true);
    expect(isAddressValid("a".repeat(64), "near")).toBe(true);
    expect(isAddressValid("0x1111111111111111111111111111111111111111", "near")).toBe(false);
  });

  it("accepts a Tron base58 address and still treats it as valid Near syntax", () => {
    const tron = "TJbLVQHYf61a36iC7oyxdMiNSoqTMKYAMv";
    expect(isAddressValid(tron, "tron")).toBe(true);
    expect(isAddressValid(tron, "near")).toBe(true);
  });

  it("accepts 32-byte Solana pubkeys and rejects EVM hex", () => {
    expect(isAddressValid("11111111111111111111111111111111", "solana")).toBe(true);
    expect(isAddressValid("0x1111111111111111111111111111111111111111", "solana")).toBe(false);
  });

  it("treats Solana addresses as case-sensitive", () => {
    const a = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
    expect(validateAddress(a, "solana").isValid).toBe(true);
    expect(sameAddress(a, a, "solana")).toBe(true);
    expect(sameAddress(a, a.toLowerCase(), "solana")).toBe(false);
  });

  it("treats EVM addresses as case-insensitive", () => {
    const a = "0x1111111111111111111111111111111111111111";
    expect(sameAddress(a, a.toUpperCase(), "evm")).toBe(true);
  });
});

describe("formatAddress", () => {
  it("truncates long 0x addresses", () => {
    expect(formatAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe("0x12...45678");
  });

  it("keeps short named accounts readable", () => {
    expect(formatAddress("alice.near")).toBe("alice.near");
  });

  it("returns an empty string for empty input", () => {
    expect(formatAddress("")).toBe("");
    expect(formatAddress(null)).toBe("");
  });
});
