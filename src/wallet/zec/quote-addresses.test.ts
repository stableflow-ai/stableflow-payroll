import { describe, expect, it } from "vitest";
import { nonemptyZecAddress, zecQuoteAddressesFrom } from "./quote-addresses";

describe("nonemptyZecAddress", () => {
  it("trims and drops empty values", () => {
    expect(nonemptyZecAddress("  u1abc  ")).toBe("u1abc");
    expect(nonemptyZecAddress("")).toBeNull();
    expect(nonemptyZecAddress("   ")).toBeNull();
    expect(nonemptyZecAddress(null)).toBeNull();
    expect(nonemptyZecAddress(undefined)).toBeNull();
  });
});

describe("zecQuoteAddressesFrom", () => {
  it("returns payer from shielded and refundTo from transparent", () => {
    expect(zecQuoteAddressesFrom("u1payer", "t1refund")).toEqual({
      payer: "u1payer",
      refundTo: "t1refund",
    });
  });

  it("returns null when either address is missing", () => {
    expect(zecQuoteAddressesFrom("u1payer", "")).toBeNull();
    expect(zecQuoteAddressesFrom("", "t1refund")).toBeNull();
    expect(zecQuoteAddressesFrom(null, "t1refund")).toBeNull();
    expect(zecQuoteAddressesFrom("u1payer", null)).toBeNull();
  });
});
