import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import {
  isPayrollBatchBroadcastable,
  mapPayrollBatch,
  mapPayrollExecution,
  mapPayoutSubmit,
} from "./payout";

describe("mapPayoutSubmit", () => {
  it("reads execution_id", () => {
    expect(mapPayoutSubmit({ execution_id: 6 })).toEqual({ executionId: 6 });
    expect(mapPayoutSubmit({ executionId: "12" })).toEqual({ executionId: 12 });
  });

  it("throws when execution_id is missing", () => {
    expect(() => mapPayoutSubmit({})).toThrow(ApiError);
  });
});

describe("mapPayrollExecution", () => {
  it("maps counters, finished, and list items", () => {
    const mapped = mapPayrollExecution({
      execution_id: 6,
      type: "expense",
      title: "Jimmy Self 1's payment request",
      total: 1,
      processed: 1,
      created: 0,
      processing: 0,
      completed: 1,
      failed: 0,
      expired: 0,
      finished: true,
      list: [
        {
          id: 8,
          execution_id: 6,
          source_item_id: 8,
          name: "Jimmy Self 1",
          purpose: "test2",
          description: "heihei",
          amount: "0.0123",
          payer: "jimmygu.near",
          recipient: "0x635FA4477c7f9681A4Ac88fA6147F441114E8655",
          status: "completed",
          tx_hash: "6nSJZGtq236eh2TkNfttuBZsw9LpKMswVt66jLmZCCkv",
        },
      ],
    });
    expect(mapped).toMatchObject({
      executionId: 6,
      type: "expense",
      title: "Jimmy Self 1's payment request",
      total: 1,
      processed: 1,
      finished: true,
    });
    expect(mapped?.list).toHaveLength(1);
    expect(mapped?.list[0]).toMatchObject({
      id: 8,
      name: "Jimmy Self 1",
      status: "completed",
      recipient: "0x635FA4477c7f9681A4Ac88fA6147F441114E8655",
    });
  });

  it("returns null without execution_id", () => {
    expect(mapPayrollExecution({ title: "x" })).toBeNull();
  });
});

describe("mapPayrollBatch transaction outputs", () => {
  it("maps amount_raw onto amountRaw and treats outputs as broadcastable", () => {
    const mapped = mapPayrollBatch({
      quote_id: "q-zec",
      batch_id: "b-zec",
      source_network: "zec",
      source_symbol: "ZEC",
      transaction: {
        outputs: [
          {
            address: "t1aDV9wRNwVrVJVSoUCUrFpcYSTbcKrc1Dj",
            amount: "0.1",
            amount_raw: "10000000",
          },
        ],
      },
    });
    expect(mapped.transaction.outputs).toEqual([
      {
        address: "t1aDV9wRNwVrVJVSoUCUrFpcYSTbcKrc1Dj",
        amount: "0.1",
        amountRaw: "10000000",
      },
    ]);
    expect(isPayrollBatchBroadcastable(mapped)).toBe(true);
  });

  it("maps destination_volume on batch payments", () => {
    const mapped = mapPayrollBatch({
      quote_id: "quote_pFQtR2UfmZn4SXbGlyJPx",
      payments: [
        {
          payment_id: "payroll_n7Wf6N0BC6axneO9rPm7Y",
          destination_volume: "99.97460000",
          destination_amount: "100",
        },
        {
          payment_id: "payroll_ZGm5aytxPGfrtN34mBQa0",
          destinationVolume: "2.47321000",
          destination_amount: "0.001",
        },
      ],
      transaction: { callData: "0xabc", batch_contract: "0xcontract" },
    });
    expect(mapped.payments.map((row) => row.destinationVolume)).toEqual([
      "99.97460000",
      "2.47321000",
    ]);
  });

  it("is not broadcastable when callData and outputs are both empty", () => {
    const mapped = mapPayrollBatch({
      transaction: { callData: "", batch_contract: "" },
    });
    expect(isPayrollBatchBroadcastable(mapped)).toBe(false);
  });
});
