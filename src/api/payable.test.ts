import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import * as httpModule from "@/lib/http";
import {
  mapPayable,
  mapPayablePayResponse,
  mapPayables,
  payPayable,
  payablePayBody,
} from "./payable";
import {
  PAYABLE_TYPE,
  effectiveNetPay,
  findExpensePayable,
  findPayable,
  parsePayableKey,
  payableAdjustments,
  payableKeyId,
  PAYABLE_NOTIFICATION_ALL,
  payableNotification,
} from "@/types/payable";
import { payrollPaymentNotification } from "@/types/payout";

describe("payableKeyId", () => {
  it("encodes payroll by period and others by batch id", () => {
    expect(payableKeyId({ type: PAYABLE_TYPE.Payroll, periodMonth: "2026-09" })).toBe(
      "payroll:2026-09",
    );
    expect(payableKeyId({ type: PAYABLE_TYPE.Expense, batchId: 12 })).toBe("expense:12");
    expect(payableKeyId({ type: PAYABLE_TYPE.Bonus, batchId: 3 })).toBe("bonus:3");
    expect(payableKeyId({ type: "office", batchId: 46 })).toBe("office:46");
  });
});

describe("parsePayableKey", () => {
  it("round-trips known keys and drops junk", () => {
    expect(parsePayableKey("payroll:2026-09")).toEqual({
      type: PAYABLE_TYPE.Payroll,
      periodMonth: "2026-09",
    });
    expect(parsePayableKey("expense:8")).toEqual({ type: PAYABLE_TYPE.Expense, batchId: 8 });
    expect(parsePayableKey("bonus:0")).toEqual({ type: PAYABLE_TYPE.Bonus, batchId: 0 });
    expect(parsePayableKey("office:46")).toEqual({ type: "office", batchId: 46 });
    expect(parsePayableKey("payroll:")).toBeNull();
    expect(parsePayableKey("expense:12.5")).toBeNull();
    expect(parsePayableKey("invoice:1")).toEqual({ type: "invoice", batchId: 1 });
  });
});

describe("mapPayables", () => {
  it("keeps payroll/expense/bonus and dynamic operation types", () => {
    const list = mapPayables([
      {
        type: "payroll",
        title: "September Payroll",
        period_month: "2026-09",
        total_payout: "35000",
        payment_date: "2026-09-01",
        list: [
          {
            id: 1,
            name: "Andrew",
            email: "andrew@gmail.com",
            address: "0xabc",
            network: "eth",
            symbol: "USDC",
            amount: "5000",
            net_pay: "5500",
          },
        ],
      },
      {
        type: "expense",
        batch_id: 9,
        title: "Open reimbursement",
        total_payout: "12000",
        list: [{ id: 4, name: "Zoey", address: "0xdef", amount: "4000", net_pay: "4000" }],
      },
      { type: "invoice", title: "Skip", batch_id: 1 },
      { type: "payroll", title: "Missing month" },
      { type: "bonus", title: "Missing batch" },
    ]);
    expect(list.map((row) => payableKeyId(row.key))).toEqual([
      "payroll:2026-09",
      "expense:9",
      "invoice:1",
    ]);
    expect(list[0]?.items[0]?.email).toBe("andrew@gmail.com");
    expect(list[1]?.items[0]?.email).toBe("");
    expect(findPayable(list, { type: PAYABLE_TYPE.Expense, batchId: 9 })?.title).toBe(
      "Open reimbursement",
    );
  });

  it("maps live payroll and expense payloads", () => {
    const list = mapPayables([
      {
        type: "payroll",
        period_month: "2026-09-01T00:00:00+08:00",
        payment_date: "2026-09-01T00:00:00+08:00",
        title: "September Payroll",
        total_payout: "0.03499737",
        total_count: 3,
        list: [
          {
            id: 1,
            name: "Emily",
            amount: "0.011",
            net_pay: "0.011",
            symbol: "USDT",
            network: "arb",
          },
        ],
      },
      {
        type: "expense",
        batch_id: 8,
        title: "Jimmy Self 1's payment request",
        total_payout: "0.01229921",
        total_count: 1,
        list: [
          {
            id: 8,
            name: "Jimmy Self 1",
            amount: "0.0123",
            volume: "0.01229921",
            symbol: "USDT",
            network: "arb",
          },
        ],
      },
    ]);
    expect(list[0]?.key).toEqual({
      type: PAYABLE_TYPE.Payroll,
      periodMonth: "2026-09-01T00:00:00+08:00",
    });
    expect(list[0]?.items[0]?.netPay).toBe("0.011");
    expect(list[0]?.items[0]?.amount).toBe("0.011");
    expect(list[1]?.key).toEqual({ type: PAYABLE_TYPE.Expense, batchId: 8 });
    expect(list[1]?.items[0]?.netPay).toBe("");
    expect(list[1]?.items[0]?.amount).toBe("0.0123");
    expect(list[1]?.items[0]?.volume).toBe("0.01229921");
  });

  it("reads a wrapped list", () => {
    expect(
      mapPayables({
        list: [{ type: "bonus", batch_id: 2, title: "Team A", list: [] }],
      }),
    ).toHaveLength(1);
  });
});

describe("findExpensePayable", () => {
  it("matches expense rows by batch id", () => {
    const list = mapPayables([
      { type: "payroll", title: "Sep", period_month: "2026-09", list: [] },
      { type: "expense", title: "Trip", batch_id: 5, list: [] },
      { type: "bonus", title: "Team", batch_id: 5, list: [] },
    ]);
    expect(findExpensePayable(list, 5)?.title).toBe("Trip");
    expect(findExpensePayable(list, 9)).toBeNull();
  });
});

describe("mapPayable", () => {
  it("maps snake_case totals and item net pay", () => {
    const payable = mapPayable({
      type: "bonus",
      batch_id: 7,
      title: "2026 Bonus",
      total_payout: "8000",
      total_count: 1,
      list: [{ id: 11, name: "Hannah", net_pay: "8000", symbol: "USDC", network: "eth" }],
    });
    expect(payable?.totalPayout).toBe("8000");
    expect(payable?.items[0]?.netPay).toBe("8000");
    expect(payable?.key).toEqual({ type: PAYABLE_TYPE.Bonus, batchId: 7 });
  });

  it("maps a dynamic operation payable", () => {
    const payable = mapPayable({
      type: "office",
      batch_id: 46,
      title: "hahahaha",
      total_payout: "0.99971300",
      total_count: 1,
      list: [
        {
          id: 58,
          batch_id: 46,
          name: "Jimmygu",
          email: "jimmygujh@gmail.com",
          address: "0x635fa4477c7f9681a4ac88fa6147f441114e8655",
          amount: "1",
          volume: "0.99971300",
          status: "pending",
          symbol: "USDT",
          network: "arb",
        },
      ],
    });
    expect(payable?.key).toEqual({ type: "office", batchId: 46 });
    expect(payable?.type).toBe("office");
    expect(payable?.items[0]?.email).toBe("jimmygujh@gmail.com");
    expect(payable?.items[0]?.volume).toBe("0.99971300");
  });
});

describe("effectiveNetPay", () => {
  it("uses list net pay, then amount, then a non-empty override", () => {
    const withNet = {
      id: 1,
      name: "Emily",
      email: "",
      address: "0x1",
      network: "arb",
      symbol: "USDT",
      amount: "0.011",
      volume: "",
      netPay: "0.011",
      purpose: "",
      status: "pending",
    };
    const withoutNet = { ...withNet, id: 8, amount: "0.0123", netPay: "" };
    expect(effectiveNetPay(withNet, {})).toBe("0.011");
    expect(effectiveNetPay(withoutNet, {})).toBe("0.0123");
    expect(effectiveNetPay(withoutNet, { 8: "0.01" })).toBe("0.01");
  });
});

describe("payableAdjustments", () => {
  it("omits unchanged and empty net pay rows", () => {
    const items = [
      {
        id: 1,
        name: "Emily",
        email: "",
        address: "0x1",
        network: "arb",
        symbol: "USDT",
        amount: "0.011",
        volume: "",
        netPay: "0.011",
        purpose: "",
        status: "pending",
      },
      {
        id: 8,
        name: "Jimmy",
        email: "",
        address: "0x2",
        network: "arb",
        symbol: "USDT",
        amount: "0.0123",
        volume: "",
        netPay: "",
        purpose: "",
        status: "pending",
      },
    ];
    expect(payableAdjustments(items, {})).toBeUndefined();
    expect(payableAdjustments(items, { 8: "" })).toBeUndefined();
    expect(payableAdjustments(items, { 1: "0.0110" })).toBeUndefined();
    expect(payableAdjustments(items, { 1: "0.01" })).toEqual([
      { item_id: 1, net_pay: "0.01" },
    ]);
  });
});

describe("payablePayBody", () => {
  it("includes timezone on payroll and omits it on expense", () => {
    expect(
      payablePayBody({
        type: PAYABLE_TYPE.Payroll,
        organization_id: 3,
        payer: "0xpayer",
        period_month: "2026-09",
        timezone: "Asia/Shanghai",
        source_network: "eth",
        source_symbol: "USDC",
      }),
    ).toEqual({
      organization_id: 3,
      payer: "0xpayer",
      source_network: "eth",
      source_symbol: "USDC",
      period_month: "2026-09",
      timezone: "Asia/Shanghai",
    });
    expect(
      payablePayBody({
        type: PAYABLE_TYPE.Expense,
        batchId: 9,
        organization_id: 3,
        payer: "0xpayer",
        source_network: "eth",
        source_symbol: "USDC",
      }),
    ).toEqual({
      organization_id: 3,
      payer: "0xpayer",
      source_network: "eth",
      source_symbol: "USDC",
    });
  });

  it("adds notification as all or comma-separated ids", () => {
    expect(payableNotification([3, 1, 3], [1, 2, 3])).toBe("1,3");
    expect(payableNotification([2, 1], [1, 2])).toBe(PAYABLE_NOTIFICATION_ALL);
    expect(
      payablePayBody({
        type: PAYABLE_TYPE.Bonus,
        batchId: 2,
        organization_id: 1,
        payer: "near.payer",
        source_network: "near",
        source_symbol: "USDT",
        notification: "1,3",
      }).notification,
    ).toBe("1,3");
    expect(payableNotification([], [1, 2])).toBeUndefined();
    expect(
      payablePayBody({
        type: PAYABLE_TYPE.Bonus,
        batchId: 2,
        organization_id: 1,
        payer: "near.payer",
        source_network: "near",
        source_symbol: "USDT",
      }).notification,
    ).toBeUndefined();
  });

  it("copies a non-empty adjustments list onto every pay body", () => {
    const adjustments = [
      { item_id: 2, net_pay: "1.25" },
      { item_id: 5, net_pay: "1" },
    ];
    expect(
      payablePayBody({
        type: PAYABLE_TYPE.Payroll,
        organization_id: 3,
        payer: "0xpayer",
        period_month: "2026-09",
        timezone: "UTC",
        source_network: "eth",
        source_symbol: "USDC",
        adjustments,
      }).adjustments,
    ).toEqual(adjustments);
    expect(
      payablePayBody({
        type: PAYABLE_TYPE.Expense,
        batchId: 9,
        organization_id: 3,
        payer: "0xpayer",
        source_network: "eth",
        source_symbol: "USDC",
        adjustments,
      }).adjustments,
    ).toEqual(adjustments);
    expect(
      payablePayBody({
        type: PAYABLE_TYPE.Bonus,
        batchId: 2,
        organization_id: 1,
        payer: "near.payer",
        source_network: "near",
        source_symbol: "USDT",
        adjustments: [],
      }).adjustments,
    ).toBeUndefined();
    expect(
      payablePayBody({
        type: "office",
        batchId: 46,
        organization_id: 3,
        payer: "0xpayer",
        source_network: "arb",
        source_symbol: "USDT",
        adjustments: [{ item_id: 58, net_pay: "1" }],
      }),
    ).toEqual({
      organization_id: 3,
      payer: "0xpayer",
      source_network: "arb",
      source_symbol: "USDT",
      batch_id: 46,
      category: "office",
    });
  });
});

describe("mapPayablePayResponse", () => {
  const batch = {
    batch_id: "b1",
    deadline: "2026-09-08T00:00:00Z",
    payer: "0xpayer",
    source_network: "eth",
    source_symbol: "USDC",
    total_source_amount: "10",
    total_source_amount_raw: "10000000",
    transaction: {
      callData: "0xabc",
      batch_contract: "0xcontract",
    },
  };

  it("reads quote_id beside batch", () => {
    const mapped = mapPayablePayResponse({ quote_id: "q-1", batch });
    expect(mapped.quoteId).toBe("q-1");
    expect(mapped.batchId).toBe("b1");
    expect(mapped.transaction.callData).toBe("0xabc");
  });

  it("throws when quote_id is missing", () => {
    expect(() => mapPayablePayResponse({ batch })).toThrow(ApiError);
    try {
      mapPayablePayResponse({ batch });
    } catch (error) {
      expect(error).toMatchObject({ code: "NO_QUOTE_ID" });
    }
  });

  it("accepts a Zcash quote that only has transaction.outputs", () => {
    const mapped = mapPayablePayResponse({
      quote_id: "q-zec",
      batch: {
        ...batch,
        source_network: "zec",
        source_symbol: "ZEC",
        transaction: {
          outputs: [
            {
              address: "t1aDV9wRNwVrVJVSoUCUrFpcYSTbcKrc1Dj",
              amount: "0.1",
              amountRaw: "10000000",
            },
          ],
        },
      },
    });
    expect(mapped.quoteId).toBe("q-zec");
    expect(mapped.transaction.outputs?.[0]?.address).toBe("t1aDV9wRNwVrVJVSoUCUrFpcYSTbcKrc1Dj");
  });

  it("throws NO_BATCH_TX when the quote has no broadcastable transaction", () => {
    try {
      mapPayablePayResponse({
        quote_id: "q-1",
        batch: { ...batch, transaction: { callData: "", batch_contract: "" } },
      });
      throw new Error("expected NO_BATCH_TX");
    } catch (error) {
      expect(error).toMatchObject({ code: "NO_BATCH_TX" });
    }
  });
});

describe("payPayable", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("quotes dynamic operations at POST /operations/pay/quote", async () => {
    const spy = vi.spyOn(httpModule, "http").mockResolvedValue({
      quote_id: "q-op",
      batch: {
        batch_id: "b-op",
        deadline: "2026-09-08T00:00:00Z",
        payer: "0xpayer",
        source_network: "arb",
        source_symbol: "USDT",
        total_source_amount: "1",
        total_source_amount_raw: "1000000",
        transaction: {
          callData: "0xabc",
          batch_contract: "0xcontract",
        },
      },
    });
    const quoted = await payPayable({
      type: "office",
      batchId: 46,
      organization_id: 3,
      payer: "0xpayer",
      source_network: "arb",
      source_symbol: "USDT",
      adjustments: [{ item_id: 58, net_pay: "1" }],
    });
    expect(quoted.quoteId).toBe("q-op");
    expect(spy).toHaveBeenCalledWith(
      "/v1/payroll/operations/pay/quote",
      expect.objectContaining({
        method: "POST",
        body: {
          organization_id: 3,
          payer: "0xpayer",
          source_network: "arb",
          source_symbol: "USDT",
          batch_id: 46,
          category: "office",
        },
      }),
    );
  });
});

describe("payrollPaymentNotification", () => {
  it("keeps email and omits empty slack", () => {
    expect(payrollPaymentNotification({ email: " andrew@gmail.com " })).toEqual({
      email: "andrew@gmail.com",
    });
    expect(payrollPaymentNotification({ email: "", slack: "" })).toBeUndefined();
    expect(payrollPaymentNotification({ slack: "ops" })).toEqual({ slack: "ops" });
  });
});
