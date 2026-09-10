import { describe, expect, it } from "vitest";
import { formatAddress, getAddressPlaceholder, isAddressValid, sameAddress, validateAddress } from "./address";

describe("address validation", () => {
  it("accepts checksum EVM addresses", () => {
    expect(isAddressValid("0x1111111111111111111111111111111111111111", "evm")).toBe(true);
  });

  it("accepts named Near accounts, hyphen labels, DAO accounts, implicit hex, numeric ids, and lowercase 0x hex", () => {
    expect(isAddressValid("alice.near", "near")).toBe(true);
    expect(isAddressValid("a-b.near", "near")).toBe(true);
    expect(isAddressValid("burrow.sputnik-dao.near", "near")).toBe(true);
    expect(isAddressValid("a".repeat(64), "near")).toBe(true);
    expect(isAddressValid("12", "near")).toBe(true);
    expect(isAddressValid("0x1111111111111111111111111111111111111111", "near")).toBe(true);
  });

  it("rejects Near accounts that fail Nomicon / near-sdk-js rules", () => {
    expect(isAddressValid("Alice.near", "near")).toBe(false);
    expect(isAddressValid("A".repeat(64), "near")).toBe(false);
    expect(isAddressValid("0X1111111111111111111111111111111111111111", "near")).toBe(false);
    expect(isAddressValid(".alice", "near")).toBe(false);
    expect(isAddressValid("alice.", "near")).toBe(false);
    expect(isAddressValid("alice..near", "near")).toBe(false);
    expect(isAddressValid("-alice.near", "near")).toBe(false);
    expect(isAddressValid("a", "near")).toBe(false);
    expect(isAddressValid(`a${"b".repeat(64)}`, "near")).toBe(false);
  });

  it("accepts a Tron base58 address and rejects it as Near syntax", () => {
    const tron = "TJbLVQHYf61a36iC7oyxdMiNSoqTMKYAMv";
    expect(isAddressValid(tron, "tron")).toBe(true);
    expect(isAddressValid(tron, "near")).toBe(false);
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

  it("accepts Zcash transparent t1 and t3 addresses", () => {
    expect(isAddressValid("t1aDV9wRNwVrVJVSoUCUrFpcYSTbcKrc1Dj", "zec")).toBe(true);
    expect(isAddressValid("t3Z4Y7w5XQvM6nN8pLqRsTuVwXyZaBcDeFg", "zcash")).toBe(true);
  });

  it("accepts a Unified Zcash u1 address", () => {
    expect(isAddressValid(
      "u1cxc6ushfeh7zk497saqxgqms48c0tlxwkxhemrlkljvupnz8qquuxkapfpnhvfeavvmwucl28sy5zqachjd4cmyqgpuuv3glzvzkzjw0w5l67gnrqmrskf7qjpx53fqnh0wdcs5raf9cdsu4mx33xfk4u6crmh47xuwt3vgzss3r67uu",
      "zec",
    )).toBe(true);
  });

  it("rejects invalid Zcash addresses", () => {
    expect(isAddressValid("t2notvalid", "zec")).toBe(false);
    expect(isAddressValid("0x1111111111111111111111111111111111111111", "zec")).toBe(false);
    expect(isAddressValid(`u1${"a".repeat(50)}`, "zec")).toBe(false);
    expect(isAddressValid(`zs1${"a".repeat(50)}`, "zec")).toBe(false);
    expect(validateAddress("zs1short", "zec").isValid).toBe(false);
    expect(validateAddress(`u1${"a".repeat(50)}`, "zec").error).toBe("Invalid Zcash address");
  });

  it("treats Zcash addresses as case-sensitive", () => {
    const a = "t1aDV9wRNwVrVJVSoUCUrFpcYSTbcKrc1Dj";
    expect(sameAddress(a, a, "zec")).toBe(true);
    expect(sameAddress(a, a.toUpperCase(), "zec")).toBe(false);
  });

  it("uses a Zcash placeholder that mentions t1 and u1", () => {
    expect(getAddressPlaceholder("zec")).toBe("t1… / u1…");
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
