import { describe, expect, it } from "vitest";
import { isNativeToken, normalizeSymbol } from "./intents-tokens";

describe("normalizeSymbol", () => {
  it("maps USDT0 to USDT and accepts payout symbols", () => {
    expect(normalizeSymbol("usdt0")).toBe("USDT");
    expect(normalizeSymbol("ETH")).toBe("ETH");
    expect(normalizeSymbol("sol")).toBe("SOL");
    expect(normalizeSymbol("WETH")).toBeNull();
  });
});

describe("isNativeToken", () => {
  it("treats empty, native, and zero address as native", () => {
    expect(isNativeToken({ contractAddress: null })).toBe(true);
    expect(isNativeToken({ contractAddress: "" })).toBe(true);
    expect(isNativeToken({ contractAddress: "native" })).toBe(true);
    expect(isNativeToken({ contractAddress: "0x0000000000000000000000000000000000000000" })).toBe(true);
  });

  it("treats wrap.near and ERC-20 addresses as contracts", () => {
    expect(isNativeToken({ contractAddress: "wrap.near" })).toBe(false);
    expect(isNativeToken({ contractAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" })).toBe(false);
  });
});
