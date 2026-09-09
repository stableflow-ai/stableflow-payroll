import { describe, expect, it } from "vitest";
import {
  expenseImportRequestBody,
  mapExpenseCurrentStats,
  mapExpenseHistoryResp,
  mapExpenseHistoryRow,
  mapExpenseImportResp,
  mapExpenseOpenList,
  mapExpenseOpenRequestsCount,
  mapExpenseOpenRow,
  mapExpenseRecentPayout,
  mapExpenseTotalPayoutPoint,
} from "./expense";

describe("mapExpenseCurrentStats", () => {
  it("maps reimbursement totals and expense counts", () => {
    expect(
      mapExpenseCurrentStats({
        total_reimbursement: "5320",
        total_reimbursement_change: "+10%",
        processed_expenses: 9,
        processed_expenses_change: "20",
        total_expenses: 23,
        total_expenses_change: "-2%",
      }),
    ).toEqual({
      totalExpense: "5320",
      totalChangePercent: 10,
      expensedCount: 9,
      expensedChangePercent: 20,
      expenseCount: 23,
      expenseChangePercent: -2,
    });
  });

  it("treats missing change as null", () => {
    expect(mapExpenseCurrentStats({}).totalChangePercent).toBeNull();
  });
});

describe("mapExpenseTotalPayoutPoint", () => {
  it("maps time and volume", () => {
    expect(mapExpenseTotalPayoutPoint({ time: "2026-08-01", volume: "3100" })).toEqual({
      time: "2026-08-01",
      volume: "3100",
    });
  });
});

describe("mapExpenseRecentPayout", () => {
  it("maps destination fields and completed status to paid", () => {
    expect(
      mapExpenseRecentPayout({
        id: 9,
        destination_amount: "800",
        destination_symbol: "USDC",
        destination_network: "near",
        recipient: "0xabc",
        status: "completed",
      }),
    ).toEqual({
      id: "9",
      amount: "800",
      token: "USDC",
      network: "near",
      recipient: "0xabc",
      status: "paid",
    });
  });
});

describe("mapExpenseOpenRow", () => {
  it("maps volume to expense and paying status to the paying action", () => {
    expect(
      mapExpenseOpenRow({
        id: 3,
        name: "Andrew",
        purpose: "Conference Travel",
        description: "Invoice of conference.pdf",
        volume: "800",
        address: "0x253",
        symbol: "USDC",
        network: "near",
        amount: "800",
        status: "processing",
      }),
    ).toEqual({
      id: "3",
      batchId: 0,
      name: "Andrew",
      purpose: "Conference Travel",
      receiptName: "Invoice of conference.pdf",
      expense: "800",
      address: "0x253",
      token: "USDC",
      network: "near",
      amount: "800",
      action: "paying",
    });
  });
});

describe("mapExpenseOpenList", () => {
  it("keeps batches grouped and reads totals", () => {
    expect(
      mapExpenseOpenList({
        total_payout: "1253.02",
        total_count: 2,
        batches: [
          {
            batch_id: 1,
            title: "September tea",
            volume: "1253.02",
            count: 2,
            list: [
              { id: 1, name: "A", amount: "800", volume: "800" },
              { id: 2, name: "B", amount: "453.02", volume: "453.02" },
            ],
          },
        ],
      }),
    ).toMatchObject({
      total: "1253.02",
      count: 2,
      batches: [
        {
          batchId: 1,
          title: "September tea",
          volume: "1253.02",
          count: 2,
          action: "pay_now",
          members: [
            { id: "1-1", batchId: 1, name: "A" },
            { id: "1-2", batchId: 1, name: "B" },
          ],
        },
      ],
    });
  });
});

describe("mapExpenseOpenRequestsCount", () => {
  it("reads the request count", () => {
    expect(mapExpenseOpenRequestsCount({ count: 2 })).toEqual({ count: 2 });
  });

  it("defaults a missing count to 0", () => {
    expect(mapExpenseOpenRequestsCount({})).toEqual({ count: 0 });
  });
});

describe("mapExpenseHistoryRow", () => {
  it("keeps the description as text", () => {
    expect(
      mapExpenseHistoryRow({
        id: 4,
        name: "Andrew",
        purpose: "Conference Travel",
        description: "Invoice of conference.pdf",
        destination_volume: "800",
        recipient: "0x253",
        destination_symbol: "USDC",
        destination_network: "near",
        destination_amount: "800",
        status: "completed",
        destination_tx_hash: "0xtx",
        paid_at: "2026-08-01T00:00:00Z",
      }),
    ).toEqual({
      id: "4",
      name: "Andrew",
      purpose: "Conference Travel",
      description: "Invoice of conference.pdf",
      receiptName: null,
      expense: "800",
      address: "0x253",
      token: "USDC",
      network: "near",
      amount: "800",
      status: "paid",
      txHash: "0xtx",
      paidAt: "2026-08-01T00:00:00Z",
    });
  });

  it("keeps a plain description and maps failed status", () => {
    expect(
      mapExpenseHistoryRow({
        id: 5,
        description: "Conference Ticket",
        amount: "252.02",
        address: "0x253",
        symbol: "USDC",
        network: "near",
        status: "failed",
      }),
    ).toMatchObject({
      description: "Conference Ticket",
      receiptName: null,
      expense: "252.02",
      status: "failed",
    });
  });
});

describe("mapExpenseHistoryResp", () => {
  it("maps paginated history", () => {
    expect(
      mapExpenseHistoryResp({
        total: 2,
        total_page: 1,
        list: [{ id: 1, name: "Andrew" }, { id: 2, name: "Hannah" }],
      }),
    ).toMatchObject({
      total: 2,
      totalPage: 1,
      list: [{ id: "1" }, { id: "2" }],
    });
  });
});

describe("mapExpenseImportResp", () => {
  it("maps batch id and count", () => {
    expect(mapExpenseImportResp({ batch_id: 12, count: 3 })).toEqual({
      batchId: 12,
      count: 3,
    });
  });
});

describe("expenseImportRequestBody", () => {
  it("sends swagger fields and omits empty optionals", () => {
    expect(
      expenseImportRequestBody({
        organizationId: 7,
        title: "  September expenses  ",
        items: [
          {
            name: "Andrew",
            address: "0x253",
            amount: "800",
            network: "near",
            symbol: "USDC",
            email: "",
            purpose: "Conference Travel",
            description: "  ",
          },
        ],
      }),
    ).toEqual({
      organization_id: 7,
      title: "September expenses",
      items: [
        {
          name: "Andrew",
          address: "0x253",
          amount: "800",
          network: "near",
          symbol: "USDC",
          purpose: "Conference Travel",
        },
      ],
    });
  });

  it("truncates title and item fields to swagger max lengths", () => {
    const body = expenseImportRequestBody({
      organizationId: 1,
      title: "T".repeat(120),
      items: [
        {
          name: "N".repeat(60),
          address: "A".repeat(140),
          amount: "1",
          network: "eth-network-name-is-too-long-for-the-api",
          symbol: "S".repeat(40),
          email: "e".repeat(120),
          purpose: "P".repeat(140),
          description: "D".repeat(5001),
        },
      ],
    });
    expect(body.title).toHaveLength(100);
    expect(body.items[0]?.name).toHaveLength(50);
    expect(body.items[0]?.address).toHaveLength(128);
    expect(body.items[0]?.network).toHaveLength(32);
    expect(body.items[0]?.symbol).toHaveLength(32);
    expect(body.items[0]?.email).toHaveLength(100);
    expect(body.items[0]?.purpose).toHaveLength(100);
    expect(body.items[0]?.description).toHaveLength(5000);
  });
});
