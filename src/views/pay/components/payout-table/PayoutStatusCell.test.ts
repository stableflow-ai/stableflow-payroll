import { describe, expect, it } from "vitest";
import { PAYOUT_ROW_STATUS, paymentRowStatus } from "./PayoutStatusCell";

describe("paymentRowStatus", () => {
  it("maps completed, failed, and expired, and treats the rest as pending", () => {
    expect(paymentRowStatus("completed")).toBe(PAYOUT_ROW_STATUS.Complete);
    expect(paymentRowStatus("complete")).toBe(PAYOUT_ROW_STATUS.Complete);
    expect(paymentRowStatus("failed")).toBe(PAYOUT_ROW_STATUS.Failed);
    expect(paymentRowStatus("expired")).toBe(PAYOUT_ROW_STATUS.Expired);
    expect(paymentRowStatus("pending")).toBe(PAYOUT_ROW_STATUS.Pending);
    expect(paymentRowStatus("processing")).toBe(PAYOUT_ROW_STATUS.Pending);
  });
});
