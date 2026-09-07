import { describe, expect, it } from "vitest";
import {
  mapPayable,
  mapPayables,
  payablePayBody,
} from "./payable";
import {
  PAYABLE_TYPE,
  findPayable,
  parsePayableKey,
  payableKeyId,
  payableNotificationIds,
} from "@/types/payable";
import { payrollPaymentNotification } from "@/types/payout";

describe("payableKeyId", () => {
  it("encodes payroll by period and others by batch id", () => {
    expect(payableKeyId({ type: PAYABLE_TYPE.Payroll, periodMonth: "2026-09" })).toBe(
      "payroll:2026-09",
    );
    expect(payableKeyId({ type: PAYABLE_TYPE.Expense, batchId: 12 })).toBe("expense:12");
    expect(payableKeyId({ type: PAYABLE_TYPE.Bonus, batchId: 3 })).toBe("bonus:3");
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
    expect(parsePayableKey("payroll:")).toBeNull();
    expect(parsePayableKey("expense:12.5")).toBeNull();
    expect(parsePayableKey("invoice:1")).toBeNull();
  });
});

describe("mapPayables", () => {
  it("keeps payroll/expense/bonus and drops unknown types", () => {
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
    ]);
    expect(list[0]?.items[0]?.email).toBe("andrew@gmail.com");
    expect(list[1]?.items[0]?.email).toBe("");
    expect(findPayable(list, { type: PAYABLE_TYPE.Expense, batchId: 9 })?.title).toBe(
      "Open reimbursement",
    );
  });

  it("reads a wrapped list", () => {
    expect(
      mapPayables({
        list: [{ type: "bonus", batch_id: 2, title: "Team A", list: [] }],
      }),
    ).toHaveLength(1);
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

  it("adds notification only when ids are selected", () => {
    const ids = payableNotificationIds([3, 1, 3]);
    expect(ids).toEqual([1, 3]);
    expect(
      payablePayBody({
        type: PAYABLE_TYPE.Bonus,
        batchId: 2,
        organization_id: 1,
        payer: "near.payer",
        source_network: "near",
        source_symbol: "USDT",
        notification: ids,
      }).notification,
    ).toEqual([1, 3]);
    expect(payableNotificationIds([])).toBeUndefined();
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
