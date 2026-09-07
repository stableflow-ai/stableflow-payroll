import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import {
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
