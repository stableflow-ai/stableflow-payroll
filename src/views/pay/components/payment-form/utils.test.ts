import { describe, expect, it } from "vitest";
import { PAYABLE_TYPE, type Payable } from "@/types/payable";
import { buildPayablePayRequest, payableQuoteSourceAmount, sumPayableNetPay, sumPayableVolume, sumQuoteDestinationVolume } from "./utils";

const PAYABLE: Payable = {
  key: { type: PAYABLE_TYPE.Payroll, periodMonth: "2026-09" },
  type: PAYABLE_TYPE.Payroll,
  title: "September Payroll",
  totalPayout: "35000",
  totalCount: 2,
  paymentDate: "2026-09-01",
  periodMonth: "2026-09",
  batchId: 0,
  items: [
    {
      id: 2,
      name: "Andrew",
      email: "a@x.com",
      address: "0x1",
      network: "eth",
      symbol: "USDC",
      amount: "1",
      volume: "",
      netPay: "1",
      purpose: "",
      status: "",
    },
    {
      id: 5,
      name: "Zoey",
      email: "",
      address: "0x2",
      network: "eth",
      symbol: "USDC",
      amount: "1",
      volume: "",
      netPay: "1",
      purpose: "",
      status: "",
    },
  ],
};

const TOKEN = {
  blockchain: "eth",
  symbol: "USDC",
  chain: { chainKind: "evm", batchEnabled: true },
} as unknown as Parameters<typeof buildPayablePayRequest>[0]["originToken"];

describe("buildPayablePayRequest", () => {
  it("always sends payroll net pay as adjustments", () => {
    expect(
      buildPayablePayRequest({
        payable: PAYABLE,
        originToken: TOKEN,
        payer: "0xpayer",
        refundTo: "0xpayer",
        organizationId: 8,
        timezone: "UTC",
        notifyEnabled: false,
        selectedItemIds: [],
      })?.adjustments,
    ).toEqual([
      { item_id: 2, net_pay: "1" },
      { item_id: 5, net_pay: "1" },
    ]);
    expect(
      buildPayablePayRequest({
        payable: PAYABLE,
        originToken: TOKEN,
        payer: "0xpayer",
        refundTo: "0xpayer",
        organizationId: 8,
        timezone: "UTC",
        notifyEnabled: false,
        selectedItemIds: [],
        netPayById: { 2: "1", 5: "" },
      })?.adjustments,
    ).toEqual([
      { item_id: 2, net_pay: "1" },
      { item_id: 5, net_pay: "1" },
    ]);
    expect(
      buildPayablePayRequest({
        payable: PAYABLE,
        originToken: TOKEN,
        payer: "0xpayer",
        refundTo: "0xpayer",
        organizationId: 8,
        timezone: "UTC",
        notifyEnabled: false,
        selectedItemIds: [],
        netPayById: { 2: "1.25" },
      })?.adjustments,
    ).toEqual([
      { item_id: 2, net_pay: "1.25" },
      { item_id: 5, net_pay: "1" },
    ]);
  });

  it("omits adjustments for expense and bonus", () => {
    const expense: Payable = {
      ...PAYABLE,
      key: { type: PAYABLE_TYPE.Expense, batchId: 8 },
      type: PAYABLE_TYPE.Expense,
      batchId: 8,
      periodMonth: "",
    };
    expect(
      buildPayablePayRequest({
        payable: expense,
        originToken: TOKEN,
        payer: "0xpayer",
        refundTo: "0xpayer",
        organizationId: 8,
        timezone: "UTC",
        notifyEnabled: false,
        selectedItemIds: [],
        netPayById: { 2: "1.25" },
      })?.adjustments,
    ).toBeUndefined();
    const bonus: Payable = {
      ...expense,
      key: { type: PAYABLE_TYPE.Bonus, batchId: 8 },
      type: PAYABLE_TYPE.Bonus,
    };
    expect(
      buildPayablePayRequest({
        payable: bonus,
        originToken: TOKEN,
        payer: "0xpayer",
        refundTo: "0xpayer",
        organizationId: 8,
        timezone: "UTC",
        notifyEnabled: false,
        selectedItemIds: [],
        netPayById: { 2: "1.25" },
      })?.adjustments,
    ).toBeUndefined();
  });

  it("adds notification only when notify is on", () => {
    expect(
      buildPayablePayRequest({
        payable: PAYABLE,
        originToken: TOKEN,
        payer: "0xpayer",
        refundTo: "0xpayer",
        organizationId: 8,
        timezone: "UTC",
        notifyEnabled: false,
        selectedItemIds: [2, 5],
      }),
    ).toMatchObject({
      type: PAYABLE_TYPE.Payroll,
      period_month: "2026-09",
      timezone: "UTC",
    });
    expect(
      buildPayablePayRequest({
        payable: PAYABLE,
        originToken: TOKEN,
        payer: "0xpayer",
        refundTo: "0xpayer",
        organizationId: 8,
        timezone: "UTC",
        notifyEnabled: false,
        selectedItemIds: [2, 5],
      })?.notification,
    ).toBeUndefined();
    expect(
      buildPayablePayRequest({
        payable: PAYABLE,
        originToken: TOKEN,
        payer: "0xpayer",
        refundTo: "0xpayer",
        organizationId: 8,
        timezone: "UTC",
        notifyEnabled: true,
        selectedItemIds: [5, 2],
      })?.notification,
    ).toBe("all");
    expect(
      buildPayablePayRequest({
        payable: PAYABLE,
        originToken: TOKEN,
        payer: "0xpayer",
        refundTo: "0xpayer",
        organizationId: 8,
        timezone: "UTC",
        notifyEnabled: true,
        selectedItemIds: [5],
      })?.notification,
    ).toBe("5");
  });
});

describe("sumPayableVolume", () => {
  it("sums item volume and ignores net pay overrides", () => {
    const mixed: Payable = {
      ...PAYABLE,
      totalPayout: "255.05378700",
      items: [
        { ...PAYABLE.items[0]!, volume: "0.99993600" },
        { ...PAYABLE.items[1]!, volume: "252.05400000" },
      ],
    };
    expect(sumPayableVolume(mixed)).toBe("253.053936");
    expect(sumPayableNetPay(mixed, { 2: "99" })).toBe("100");
  });

  it("falls back to totalPayout when every volume is empty", () => {
    expect(sumPayableVolume(PAYABLE)).toBe("35000");
  });
});

describe("sumPayableNetPay", () => {
  it("sums overrides when present and payable net pay otherwise", () => {
    expect(sumPayableNetPay(PAYABLE, {})).toBe("2");
    expect(sumPayableNetPay(PAYABLE, { 2: "1.25" })).toBe("2.25");
  });

  it("falls back to amount when list net pay is empty", () => {
    const expense: Payable = {
      ...PAYABLE,
      key: { type: PAYABLE_TYPE.Expense, batchId: 8 },
      type: PAYABLE_TYPE.Expense,
      items: [
        { ...PAYABLE.items[0]!, id: 8, amount: "0.0123", netPay: "" },
        { ...PAYABLE.items[1]!, id: 9, amount: "0.011", netPay: "" },
      ],
    };
    expect(sumPayableNetPay(expense, {})).toBe("0.0233");
  });
});

describe("buildPayablePayRequest operations", () => {
  it("quotes operations with category and omits adjustments", () => {
    const payable: Payable = {
      ...PAYABLE,
      key: { type: "office", batchId: 46 },
      type: "office",
      batchId: 46,
      periodMonth: "",
    };
    const request = buildPayablePayRequest({
      payable,
      originToken: TOKEN,
      payer: "0xpayer",
      refundTo: "0xpayer",
      organizationId: 8,
      timezone: "UTC",
      notifyEnabled: false,
      selectedItemIds: [],
      netPayById: { 2: "1.25" },
    });
    expect(request).toMatchObject({
      type: "office",
      batchId: 46,
    });
    expect(request && "adjustments" in request ? request.adjustments : undefined).toBeUndefined();
    expect(request).toMatchObject({
      payer: "0xpayer",
      refundTo: "0xpayer",
    });
  });

  it("returns null when refundTo is missing", () => {
    expect(
      buildPayablePayRequest({
        payable: PAYABLE,
        originToken: TOKEN,
        payer: "0xpayer",
        refundTo: null,
        organizationId: 8,
        timezone: "UTC",
        notifyEnabled: false,
        selectedItemIds: [],
      }),
    ).toBeNull();
  });
});

describe("sumQuoteDestinationVolume", () => {
  it("sums destination_volume from quote payments", () => {
    expect(
      sumQuoteDestinationVolume([
        { destinationVolume: "99.97460000" },
        { destinationVolume: "2.47321000" },
      ]),
    ).toBe("102.44781");
    expect(sumQuoteDestinationVolume([{ destinationVolume: "" }])).toBe("0");
  });
});

describe("payableQuoteSourceAmount", () => {
  it("sums total_source_amount across quote batches", () => {
    expect(
      payableQuoteSourceAmount({
        quoteId: "q-1",
        batches: [
          {
            quoteBatchId: "qbatch-1",
            batch: { totalSourceAmount: "18000" } as never,
          },
          {
            quoteBatchId: "qbatch-2",
            batch: { totalSourceAmount: "17001.235" } as never,
          },
        ],
      }),
    ).toBe("35001.235");
  });
});
