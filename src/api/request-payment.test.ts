import { describe, expect, it } from "vitest";
import { EMPLOYEE_PAYMENT_TYPE } from "@/types/overview";
import {
  mapDefaultAddresses,
  mapOpenPaymentRequests,
  mapPaymentRequestItem,
  mapPaymentRequestListResp,
  mapRecentPaymentRequests,
} from "./request-payment";

describe("mapPaymentRequestItem", () => {
  it("maps snake_case fields and destination hash fallbacks", () => {
    expect(
      mapPaymentRequestItem({
        batch_id: 5,
        title: "Jimmy Self 1's payment request",
        user_id: 4,
        name: "Jimmy Self 1",
        email: "a@example.com",
        purpose: "test1",
        description: "test",
        amount: "0.011",
        symbol: "USDT",
        network: "arb",
        recipient: "0x635fa4477c7f9681a4ac88fa6147f441114e8655",
        status: "Pending",
        payment_id: "",
        payer_user_id: 0,
        payer: "",
        paid_at: null,
        created_at: "2026-09-07T12:25:43.216Z",
        updated_at: "2026-09-07T12:25:43.216Z",
        destination_tx_hash: "0xabc",
      }),
    ).toEqual({
      batchId: 5,
      title: "Jimmy Self 1's payment request",
      userId: 4,
      name: "Jimmy Self 1",
      email: "a@example.com",
      purpose: "test1",
      description: "test",
      amount: "0.011",
      symbol: "USDT",
      network: "arb",
      recipient: "0x635fa4477c7f9681a4ac88fa6147f441114e8655",
      status: "pending",
      paymentId: "",
      payerUserId: 0,
      payer: "",
      paidAt: "",
      createdAt: "2026-09-07T12:25:43.216Z",
      updatedAt: "2026-09-07T12:25:43.216Z",
      destinationTxHash: "0xabc",
    });
  });

  it("drops rows without a positive batch id", () => {
    expect(mapPaymentRequestItem({ purpose: "x" })).toBeNull();
    expect(mapPaymentRequestItem({ batch_id: 0, purpose: "x" })).toBeNull();
  });
});

describe("mapPaymentRequestListResp", () => {
  it("maps list pagination", () => {
    const mapped = mapPaymentRequestListResp({
      list: [{ batch_id: 5, purpose: "Office", amount: "10", symbol: "USDT", network: "arb" }],
      total: 12,
      total_page: 2,
    });
    expect(mapped.total).toBe(12);
    expect(mapped.totalPage).toBe(2);
    expect(mapped.list[0]?.purpose).toBe("Office");
  });
});

describe("mapOpenPaymentRequests", () => {
  it("prefers purpose then title", () => {
    expect(
      mapOpenPaymentRequests([
        { batch_id: 1, purpose: "Invoice", title: "Fallback", created_at: "2026-09-01T00:00:00.000Z" },
        { batch_id: 2, purpose: "  ", title: "Trip", created_at: "2026-09-02T00:00:00.000Z" },
      ]),
    ).toEqual([
      { id: "1", name: "Invoice", createdAt: "2026-09-01T00:00:00.000Z" },
      { id: "2", name: "Trip", createdAt: "2026-09-02T00:00:00.000Z" },
    ]);
  });
});

describe("mapRecentPaymentRequests", () => {
  it("maps memo to purpose and destination fields", () => {
    const [row] = mapRecentPaymentRequests([
      {
        payment_id: "pay-1",
        batch_id: 9,
        type: "payout",
        memo: "August Payroll",
        payer: "0xaa",
        recipient: "0xbb",
        destination_amount: "4000",
        destination_symbol: "USDT",
        destination_network: "arb",
        destination_tx_hash: "0x1",
        paid_at: "2026-09-01T11:56:00.000Z",
        status: "completed",
      },
    ]);
    expect(row).toMatchObject({
      id: "pay-1",
      type: EMPLOYEE_PAYMENT_TYPE.Payout,
      purpose: "August Payroll",
      from: "0xaa",
      to: "0xbb",
      amount: "4000",
      token: "USDT",
      network: "arb",
      time: "2026-09-01T11:56:00.000Z",
      status: "completed",
    });
    expect(row?.explorerUrl).toContain("0x1");
  });

  it("defaults unknown type to income and falls back to source fields", () => {
    const [row] = mapRecentPaymentRequests([
      {
        batch_id: 3,
        type: "other",
        source_amount: "12",
        source_symbol: "USDC",
        source_network: "eth",
        tx_hash: "0xsrc",
        submitted_at: "2026-08-01T00:00:00.000Z",
        status: "processing",
      },
    ]);
    expect(row).toMatchObject({
      id: "3",
      type: EMPLOYEE_PAYMENT_TYPE.Income,
      amount: "12",
      token: "USDC",
      network: "eth",
      time: "2026-08-01T00:00:00.000Z",
    });
    expect(row?.explorerUrl).toContain("0xsrc");
  });
});

describe("mapDefaultAddresses", () => {
  it("keeps address/network pairs and drops blanks", () => {
    expect(
      mapDefaultAddresses([
        { address: "0xabc", network: "arb" },
        { address: "  ", network: "eth" },
        { address: "near.near", network: "near" },
      ]),
    ).toEqual([
      { address: "0xabc", network: "arb" },
      { address: "near.near", network: "near" },
    ]);
  });
});
