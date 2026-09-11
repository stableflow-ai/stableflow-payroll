import { describe, expect, it } from "vitest";
import {
  batchPayoutCommitTitle,
  batchPaymentRowLabel,
  batchSplitBannerText,
} from "./config";

describe("batchSplitBannerText", () => {
  it("uses two for a pair of payments", () => {
    expect(batchSplitBannerText(2)).toBe(
      "A batch payment can support up to 50 transactions, and this payment will be divided into two payments",
    );
  });

  it("falls back to the number past ten", () => {
    expect(batchSplitBannerText(11)).toContain("11 payments");
  });
});

describe("batchPaymentRowLabel", () => {
  it("numbers batches from 1", () => {
    expect(batchPaymentRowLabel(1)).toBe("Batch Payment 1");
    expect(batchPaymentRowLabel(2)).toBe("Batch Payment 2");
  });
});

describe("batchPayoutCommitTitle", () => {
  it("keeps the form title for a single batch", () => {
    expect(batchPayoutCommitTitle("September Payroll", 1, 1)).toBe("September Payroll");
  });

  it("appends the batch index when split", () => {
    expect(batchPayoutCommitTitle("September Payroll", 1, 2)).toBe(
      "September Payroll_Batch Payment 1",
    );
  });
});
