import Big from "big.js";
import { describe, expect, it } from "vitest";
import { formatAmount, ROUND_DOWN, ROUND_UP } from "./amount";

describe("formatAmount", () => {
  it("groups thousands and prefixes $", () => {
    expect(formatAmount("12345.6")).toBe("$12,345.6");
  });

  it("pads fraction digits when requested", () => {
    expect(formatAmount("1.5", { padDecimals: true })).toBe("$1.50");
  });

  it("converts chain minor units with decimals", () => {
    expect(formatAmount("1000000", { decimals: 6, maxDecimals: 2, padDecimals: true })).toBe("$1.00");
  });

  it("rounds down by default and accepts toFixed rounding", () => {
    expect(formatAmount("1.239", { maxDecimals: 2 })).toBe("$1.23");
    expect(formatAmount("1.239", { maxDecimals: 2, rounding: ROUND_DOWN })).toBe("$1.23");
    expect(formatAmount("1.231", { maxDecimals: 2, rounding: ROUND_UP })).toBe("$1.24");
  });

  it("avoids scientific notation for large and tiny values", () => {
    expect(formatAmount("123456789012345", { maxDecimals: 0 })).toBe("$123,456,789,012,345");
    expect(formatAmount("1e-8", { maxDecimals: 8, padDecimals: true })).toBe("$0.00000001");
  });

  it("shows a dust label when enabled", () => {
    expect(formatAmount("0.001", { maxDecimals: 2, showDust: true })).toBe("$ <0.01");
  });

  it("accepts Big instances and invalid input", () => {
    expect(formatAmount(new Big("10"), { padDecimals: true })).toBe("$10.00");
    expect(formatAmount("not-a-number", { padDecimals: true })).toBe("$0.00");
  });

  it("places the minus sign after the prefix", () => {
    expect(formatAmount("-12.3", { padDecimals: true })).toBe("$-12.30");
  });
});
