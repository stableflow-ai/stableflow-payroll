import { describe, expect, it } from "vitest";
import { HISTORY_AMOUNT_FILTER } from "./config";
import { historyMatchesAmount, historyOptionalFilter } from "./utils";

describe("historyOptionalFilter", () => {
  it("drops the All sentinel", () => {
    expect(historyOptionalFilter("all")).toBeUndefined();
    expect(historyOptionalFilter("base")).toBe("base");
  });
});

describe("historyMatchesAmount", () => {
  it("splits amounts into the v3 report buckets", () => {
    expect(historyMatchesAmount("999", HISTORY_AMOUNT_FILTER.Under1k)).toBe(true);
    expect(historyMatchesAmount("1000", HISTORY_AMOUNT_FILTER.Under1k)).toBe(false);
    expect(historyMatchesAmount("1000", HISTORY_AMOUNT_FILTER.From1kTo10k)).toBe(true);
    expect(historyMatchesAmount("9999", HISTORY_AMOUNT_FILTER.From1kTo10k)).toBe(true);
    expect(historyMatchesAmount("10000", HISTORY_AMOUNT_FILTER.From1kTo10k)).toBe(false);
    expect(historyMatchesAmount("11000", HISTORY_AMOUNT_FILTER.Over10k)).toBe(true);
    expect(historyMatchesAmount("11000", HISTORY_AMOUNT_FILTER.All)).toBe(true);
  });
});
