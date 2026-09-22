import { TronWeb } from "tronweb";
import { describe, expect, it } from "vitest";
import { normalizeTronAddress, parseTronUint256 } from "./balance";

const USDT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const USDT_HEX = "41a614f803b6fd780986a42c78ec9c7f77e6ded13c";
const SPENDER_HEX = "12c96141dd8595f20af78c8935d281cefcbd47d8";

describe("parseTronUint256", () => {
  it("parses a 64-char hex constant_result without 0x", () => {
    expect(parseTronUint256("000000000000000000000000000000000000000000000000000000000635cfcb"))
      .toBe(104189899n);
  });

  it("parses a 0x hex string", () => {
    expect(parseTronUint256("0x635cfcb")).toBe(104189899n);
  });

  it("parses a decimal string", () => {
    expect(parseTronUint256("104189899")).toBe(104189899n);
  });

  it("returns 0n for unparseable values", () => {
    expect(parseTronUint256("[object Object]")).toBe(0n);
    expect(parseTronUint256(undefined)).toBe(0n);
  });
});

describe("normalizeTronAddress", () => {
  it("keeps a base58 Tron address", () => {
    expect(normalizeTronAddress(USDT)).toBe(USDT);
  });

  it("converts 41-prefixed hex to base58", () => {
    expect(normalizeTronAddress(USDT_HEX)).toBe(USDT);
  });

  it("converts a 0x EVM-style 20-byte address to base58", () => {
    const expected = TronWeb.address.fromHex(`41${SPENDER_HEX}`);
    expect(normalizeTronAddress(`0x${SPENDER_HEX}`)).toBe(expected);
  });

  it("returns null for an invalid address", () => {
    expect(normalizeTronAddress("not-an-address")).toBeNull();
  });
});
