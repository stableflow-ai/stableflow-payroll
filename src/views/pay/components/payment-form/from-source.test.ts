import { describe, expect, it } from "vitest";
import { PAYABLE_TYPE } from "@/types/payable";
import type { BonusPendingItem } from "@/types/bonus";
import type { ExpenseOpenBatch } from "@/types/expense";
import type { PayrollNextRun } from "@/types/payroll";
import {
  bonusItemToPayable,
  expenseBatchToPayable,
  findExpenseOpenBatch,
  openMemberItemId,
  operationBatchToPayable,
  payrollNextToPayable,
} from "./from-source";

const NEXT: PayrollNextRun = {
  totalPayout: "9000",
  recipients: 2,
  payDate: "2026-09-01T00:00:00+08:00",
  payable: true,
  rows: [
    {
      id: "11",
      name: "Andrew",
      address: "0x1",
      email: "a@x.com",
      token: "USDC",
      network: "eth",
      amount: "5000",
      netPay: "4800",
    },
    {
      id: "12",
      name: "Zoey",
      address: "0x2",
      email: "",
      token: "USDT",
      network: "arb",
      amount: "4000",
      netPay: "4000",
    },
  ],
};

const EXPENSE_BATCH: ExpenseOpenBatch = {
  batchId: 12,
  title: "Conference",
  volume: "1253.02",
  count: 2,
  action: "pay_now",
  members: [
    {
      id: "12-7",
      batchId: 12,
      name: "A",
      purpose: "Travel",
      receiptName: "a.pdf",
      expense: "800",
      address: "0xa",
      token: "USDC",
      network: "eth",
      amount: "800",
      action: "pay_now",
    },
    {
      id: "12-8",
      batchId: 12,
      name: "B",
      purpose: "Hotel",
      receiptName: "",
      expense: "453.02",
      address: "0xb",
      token: "USDT",
      network: "arb",
      amount: "453.02",
      action: "pay_now",
    },
  ],
};

const BONUS_ITEM: BonusPendingItem = {
  id: "3",
  batchId: 3,
  title: "Q3 Bonus",
  amount: "200",
  token: "USDC",
  action: "pay_now",
  members: [
    {
      id: "3-21",
      name: "Carol",
      address: "0xc",
      email: "c@x.com",
      amount: "200",
      token: "USDC",
    },
  ],
};

describe("openMemberItemId", () => {
  it("strips the batch prefix", () => {
    expect(openMemberItemId("12-7", 12)).toBe(7);
    expect(openMemberItemId("7", 12)).toBe(7);
    expect(openMemberItemId("12-0", 12)).toBeNull();
    expect(openMemberItemId("uuid", 12)).toBeNull();
  });
});

describe("payrollNextToPayable", () => {
  it("maps next payroll onto a payroll payable", () => {
    const form = payrollNextToPayable(NEXT);
    expect(form).toMatchObject({
      key: { type: PAYABLE_TYPE.Payroll, periodMonth: NEXT.payDate },
      type: PAYABLE_TYPE.Payroll,
      title: "September Payroll",
      totalPayout: "9000",
      totalCount: 2,
      paymentDate: NEXT.payDate,
      periodMonth: NEXT.payDate,
      batchId: 0,
    });
    expect(form?.items).toEqual([
      {
        id: 11,
        name: "Andrew",
        email: "a@x.com",
        address: "0x1",
        network: "eth",
        symbol: "USDC",
        amount: "5000",
        volume: "",
        netPay: "4800",
        purpose: "",
        status: "",
      },
      {
        id: 12,
        name: "Zoey",
        email: "",
        address: "0x2",
        network: "arb",
        symbol: "USDT",
        amount: "4000",
        volume: "",
        netPay: "4000",
        purpose: "",
        status: "",
      },
    ]);
  });

  it("returns null without a pay date and drops non-numeric row ids", () => {
    expect(payrollNextToPayable({ ...NEXT, payDate: "  " })).toBeNull();
    const form = payrollNextToPayable({
      ...NEXT,
      rows: [{ ...NEXT.rows[0], id: "not-an-id" }, NEXT.rows[1]],
    });
    expect(form?.items).toHaveLength(1);
    expect(form?.items[0]?.id).toBe(12);
  });
});

describe("expenseBatchToPayable", () => {
  it("maps an open batch and restores member ids", () => {
    const form = expenseBatchToPayable(EXPENSE_BATCH);
    expect(form).toMatchObject({
      key: { type: PAYABLE_TYPE.Expense, batchId: 12 },
      type: PAYABLE_TYPE.Expense,
      title: "Conference",
      totalPayout: "1253.02",
      totalCount: 2,
      batchId: 12,
    });
    expect(form?.items.map((item) => item.id)).toEqual([7, 8]);
    expect(form?.items[0]).toMatchObject({
      volume: "800",
      purpose: "Travel",
      email: "",
      netPay: "",
      symbol: "USDC",
      network: "eth",
    });
  });

  it("returns null when batchId is missing", () => {
    expect(expenseBatchToPayable({ ...EXPENSE_BATCH, batchId: 0 })).toBeNull();
  });
});

describe("bonusItemToPayable", () => {
  it("maps an open bonus and leaves network empty", () => {
    const form = bonusItemToPayable(BONUS_ITEM);
    expect(form).toMatchObject({
      key: { type: PAYABLE_TYPE.Bonus, batchId: 3 },
      type: PAYABLE_TYPE.Bonus,
      title: "Q3 Bonus",
      totalPayout: "200",
      totalCount: 1,
      batchId: 3,
    });
    expect(form?.items).toEqual([
      {
        id: 21,
        name: "Carol",
        email: "c@x.com",
        address: "0xc",
        network: "",
        symbol: "USDC",
        amount: "200",
        volume: "",
        netPay: "",
        purpose: "",
        status: "",
      },
    ]);
  });

  it("returns null when batchId is missing", () => {
    expect(bonusItemToPayable({ ...BONUS_ITEM, batchId: 0 })).toBeNull();
  });
});

describe("operationBatchToPayable", () => {
  it("maps an open operation batch with the category type", () => {
    const form = operationBatchToPayable(EXPENSE_BATCH, "office");
    expect(form).toMatchObject({
      key: { type: "office", batchId: 12 },
      type: "office",
      title: "Conference",
      totalPayout: "1253.02",
      totalCount: 2,
      batchId: 12,
    });
    expect(form?.items.map((item) => item.id)).toEqual([7, 8]);
  });

  it("returns null without a category or batch id", () => {
    expect(operationBatchToPayable(EXPENSE_BATCH, " ")).toBeNull();
    expect(operationBatchToPayable({ ...EXPENSE_BATCH, batchId: 0 }, "office")).toBeNull();
  });
});

describe("findExpenseOpenBatch", () => {
  it("finds the batch by id", () => {
    expect(findExpenseOpenBatch([EXPENSE_BATCH], 12)).toBe(EXPENSE_BATCH);
    expect(findExpenseOpenBatch([EXPENSE_BATCH], 9)).toBeNull();
  });
});
