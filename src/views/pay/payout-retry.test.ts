import { describe, expect, it } from "vitest";
import {
  isPayoutRetryStatus,
  payoutExecutionItemId,
  payoutRetryCopy,
  payoutRetryLabel,
  PAYOUT_RETRY_EXPIRED_COPY,
  PAYOUT_RETRY_FAILED_COPY,
} from "./payout-retry";

describe("payoutExecutionItemId", () => {
  it("posts the row id as a positive integer", () => {
    expect(payoutExecutionItemId("7")).toBe(7);
    expect(payoutExecutionItemId("0")).toBeNull();
    expect(payoutExecutionItemId("abc")).toBeNull();
    expect(payoutExecutionItemId("row-1")).toBeNull();
  });
});

describe("isPayoutRetryStatus", () => {
  it("allows failed and expired", () => {
    expect(isPayoutRetryStatus("failed")).toBe(true);
    expect(isPayoutRetryStatus("expired")).toBe(true);
    expect(isPayoutRetryStatus("paid")).toBe(false);
  });
});

describe("payoutRetryCopy", () => {
  it("uses distinct copy for failed and expired", () => {
    expect(payoutRetryCopy("failed")).toBe(PAYOUT_RETRY_FAILED_COPY);
    expect(payoutRetryCopy("expired")).toBe(PAYOUT_RETRY_EXPIRED_COPY);
  });
});

describe("payoutRetryLabel", () => {
  it("labels expired separately from failed", () => {
    expect(payoutRetryLabel("failed")).toBe("Failed");
    expect(payoutRetryLabel("expired")).toBe("Expired");
  });
});
