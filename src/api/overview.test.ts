import { describe, expect, it } from "vitest";
import { mapMemberOverviewPayoutPoints, mapMemberOverviewStats } from "./overview";

describe("mapMemberOverviewStats", () => {
  it("maps snake_case totals", () => {
    expect(
      mapMemberOverviewStats({
        total_income: "16530",
        payment_transactions: 4,
        total_payout: "1250.35",
        payout_transactions: 3,
      }),
    ).toEqual({
      totalIncome: "16530",
      incomeTxCount: 4,
      totalPayout: "1250.35",
      payoutTxCount: 3,
    });
  });
});

describe("mapMemberOverviewPayoutPoints", () => {
  it("maps time to label and numeric income/payout", () => {
    expect(
      mapMemberOverviewPayoutPoints([
        {
          time: "Aug",
          income: "3700",
          income_transactions: 1,
          payout: "105.23",
          payout_transactions: 2,
        },
        { time: "  ", income: "1", payout: "1" },
      ]),
    ).toEqual([
      { label: "Aug", income: 3700, payout: 105.23, incomeTx: 1, payoutTx: 2 },
    ]);
  });
});
