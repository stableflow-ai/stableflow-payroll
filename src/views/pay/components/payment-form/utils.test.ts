import { describe, expect, it } from "vitest";
import { PAYABLE_TYPE, type Payable } from "@/types/payable";
import { buildPayablePayRequest, sumPayableNetPay } from "./utils";

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
  it("omits adjustments until a net pay override differs from the list", () => {
    expect(
      buildPayablePayRequest({
        payable: PAYABLE,
        originToken: TOKEN,
        payer: "0xpayer",
        organizationId: 8,
        timezone: "UTC",
        notifyEnabled: false,
        selectedItemIds: [],
      })?.adjustments,
    ).toBeUndefined();
    expect(
      buildPayablePayRequest({
        payable: PAYABLE,
        originToken: TOKEN,
        payer: "0xpayer",
        organizationId: 8,
        timezone: "UTC",
        notifyEnabled: false,
        selectedItemIds: [],
        netPayById: { 2: "1", 5: "" },
      })?.adjustments,
    ).toBeUndefined();
    expect(
      buildPayablePayRequest({
        payable: PAYABLE,
        originToken: TOKEN,
        payer: "0xpayer",
        organizationId: 8,
        timezone: "UTC",
        notifyEnabled: false,
        selectedItemIds: [],
        netPayById: { 2: "1.25" },
      })?.adjustments,
    ).toEqual([{ item_id: 2, net_pay: "1.25" }]);
  });

  it("adds notification only when notify is on", () => {
    expect(
      buildPayablePayRequest({
        payable: PAYABLE,
        originToken: TOKEN,
        payer: "0xpayer",
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
        organizationId: 8,
        timezone: "UTC",
        notifyEnabled: true,
        selectedItemIds: [5],
      })?.notification,
    ).toBe("5");
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
