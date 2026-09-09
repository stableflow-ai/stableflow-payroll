import { describe, expect, it } from "vitest";
import {
  HISTORY_AMOUNT_INCOME_CLASS,
  HISTORY_AMOUNT_PAYOUT_CLASS,
  HISTORY_STATUS_FAILED_CLASS,
  HISTORY_STATUS_OTHER_CLASS,
  HISTORY_STATUS_SUCCESS_CLASS,
} from "./config";
import {
  historyAmountDisplay,
  historyOptionalFilter,
  historyStatusClass,
  historyStatusLabel,
  historyTypeLabel,
} from "./utils";

describe("historyOptionalFilter", () => {
  it("drops the All sentinel", () => {
    expect(historyOptionalFilter("all")).toBeUndefined();
    expect(historyOptionalFilter("base")).toBe("base");
  });
});

describe("historyStatusClass", () => {
  it("colors completed green, failed/expired red, and the rest black", () => {
    expect(historyStatusClass("completed")).toBe(HISTORY_STATUS_SUCCESS_CLASS);
    expect(historyStatusClass("success")).toBe(HISTORY_STATUS_SUCCESS_CLASS);
    expect(historyStatusClass("failed")).toBe(HISTORY_STATUS_FAILED_CLASS);
    expect(historyStatusClass("expired")).toBe(HISTORY_STATUS_FAILED_CLASS);
    expect(historyStatusClass("created")).toBe(HISTORY_STATUS_OTHER_CLASS);
    expect(historyStatusClass("processing")).toBe(HISTORY_STATUS_OTHER_CLASS);
  });
});

describe("historyStatusLabel", () => {
  it("uses the filter labels", () => {
    expect(historyStatusLabel("completed")).toBe("Completed");
    expect(historyStatusLabel("")).toBe("-");
  });
});

describe("historyTypeLabel", () => {
  it("uses Income, Payout, or a dash", () => {
    expect(historyTypeLabel("income")).toBe("Income");
    expect(historyTypeLabel("payout")).toBe("Payout");
    expect(historyTypeLabel(null)).toBe("-");
  });
});

describe("historyAmountDisplay", () => {
  it("signs and colors income and payout from type", () => {
    expect(historyAmountDisplay("5000", "income")).toEqual({
      text: "+5,000",
      className: HISTORY_AMOUNT_INCOME_CLASS,
    });
    expect(historyAmountDisplay("1000", "payout")).toEqual({
      text: "-1,000",
      className: HISTORY_AMOUNT_PAYOUT_CLASS,
    });
    expect(historyAmountDisplay("-1000", "payout").text).toBe("-1,000");
  });

  it("leaves unsigned amount uncolored when type is missing", () => {
    expect(historyAmountDisplay("1000", null)).toEqual({
      text: "1,000",
      className: "",
    });
  });
});
