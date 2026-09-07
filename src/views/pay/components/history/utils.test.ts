import { describe, expect, it } from "vitest";
import {
  HISTORY_STATUS_FAILED_CLASS,
  HISTORY_STATUS_OTHER_CLASS,
  HISTORY_STATUS_SUCCESS_CLASS,
} from "./config";
import { historyOptionalFilter, historyStatusClass, historyStatusLabel } from "./utils";

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
