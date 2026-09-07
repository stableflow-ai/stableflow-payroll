import { describe, expect, it } from "vitest";
import {
  fallbackPayrollImportName,
  parsePayrollImportRows,
  payDayFromPaymentDate,
  payrollNextRunToPayDay,
  payrollPayDayToParam,
  payrollPayDayToType,
  payrollSalaryItemId,
  payrollUpdateDeleteIds,
  recipientRowsToImportItems,
  recipientRowsToUpdateItems,
} from "./utils";

describe("parsePayrollImportRows", () => {
  it("reads email from a named header after recipient", () => {
    const { rows, truncated } = parsePayrollImportRows([
      ["recipient", "email", "amount", "token", "network", "memo"],
      ["0x557be3f47a45499385f60cd64e2ff455e42a3311", "alice@example.com", "100", "USDC", "eth", "payroll"],
    ]);
    expect(truncated).toBe(false);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      name: "alice",
      address: "0x557be3f47a45499385f60cd64e2ff455e42a3311",
      email: "alice@example.com",
      token: "USDC",
      network: "eth",
      amount: "100",
      memo: "payroll",
    });
  });

  it("uses a name column when present", () => {
    const { rows } = parsePayrollImportRows([
      ["name", "recipient", "email", "amount", "token", "network", "memo"],
      ["Andrew", "0x557be3f47a45499385f60cd64e2ff455e42a3311", "alice@example.com", "100", "USDC", "eth", ""],
    ]);
    expect(rows[0]?.name).toBe("Andrew");
  });

  it("returns no rows for an empty file", () => {
    expect(parsePayrollImportRows([])).toEqual({ rows: [], truncated: false });
    expect(parsePayrollImportRows([["recipient", "email", "amount", "token", "network", "memo"]])).toEqual({
      rows: [],
      truncated: false,
    });
  });
});

describe("fallbackPayrollImportName", () => {
  it("prefers name, then email local-part, then a shortened address", () => {
    expect(fallbackPayrollImportName("Andrew", "alice@example.com", "0x1234567890abcdef1234567890abcdef12345678")).toBe("Andrew");
    expect(fallbackPayrollImportName("", "alice@example.com", "0x1234567890abcdef1234567890abcdef12345678")).toBe("alice");
    expect(fallbackPayrollImportName("", "", "0x1234567890abcdef1234567890abcdef12345678")).toBe("0x1234...5678");
  });
});

describe("payrollPayDayToParam", () => {
  it("maps 1 to first_day, 31 to last_day, and other days to day_of_month", () => {
    expect(payrollPayDayToParam(1)).toEqual({ payrollDayType: "first_day" });
    expect(payrollPayDayToParam(31)).toEqual({ payrollDayType: "last_day" });
    expect(payrollPayDayToParam(15)).toEqual({
      payrollDayType: "day_of_month",
      payrollDay: 15,
    });
  });
});

describe("payrollPayDayToType", () => {
  it("classifies 1, 31, and mid-month days", () => {
    expect(payrollPayDayToType(1)).toBe("first_day");
    expect(payrollPayDayToType(31)).toBe("last_day");
    expect(payrollPayDayToType(12)).toBe("day_of_month");
  });
});

describe("payDayFromPaymentDate", () => {
  it("maps the 1st to 1 and the last calendar day to 31", () => {
    expect(payDayFromPaymentDate("2026-10-01")).toBe(1);
    expect(payDayFromPaymentDate("2026-10-31")).toBe(31);
    expect(payDayFromPaymentDate("2026-02-28")).toBe(31);
    expect(payDayFromPaymentDate("2026-10-15")).toBe(15);
  });
});

describe("payrollNextRunToPayDay", () => {
  it("prefers payroll_day_type and falls back to payment_date", () => {
    expect(
      payrollNextRunToPayDay({
        payDate: "2026-10-15",
        payrollDayType: "first_day",
      }),
    ).toBe(1);
    expect(
      payrollNextRunToPayDay({
        payDate: "2026-10-01",
        payrollDayType: "last_day",
      }),
    ).toBe(31);
    expect(
      payrollNextRunToPayDay({
        payDate: "2026-10-01",
        payrollDayType: "day_of_month",
        payrollDay: 12,
      }),
    ).toBe(12);
    expect(payrollNextRunToPayDay({ payDate: "2026-10-15" })).toBe(15);
  });
});

describe("payrollSalaryItemId", () => {
  it("parses positive integer ids and ignores UUIDs", () => {
    expect(payrollSalaryItemId("12")).toBe(12);
    expect(payrollSalaryItemId("0")).toBeUndefined();
    expect(payrollSalaryItemId("a1b2c3d4-e5f6-7890-abcd-ef1234567890")).toBeUndefined();
  });
});

describe("recipientRowsToUpdateItems", () => {
  it("keeps numeric ids, omits new-row UUIDs, and skips empty email", () => {
    expect(
      recipientRowsToUpdateItems([
        {
          id: "7",
          name: "Andrew",
          address: "0xabc",
          email: "andrew@example.com",
          token: "USDC",
          network: "eth",
          amount: "100",
          netPay: "100",
        },
        {
          id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          name: "Hannah",
          address: "0xdef",
          email: "",
          token: "USDT",
          network: "near",
          amount: "50",
          netPay: "50",
        },
      ]),
    ).toEqual([
      {
        id: 7,
        name: "Andrew",
        address: "0xabc",
        amount: "100",
        network: "eth",
        symbol: "USDC",
        email: "andrew@example.com",
      },
      {
        name: "Hannah",
        address: "0xdef",
        amount: "50",
        network: "near",
        symbol: "USDT",
      },
    ]);
  });
});

describe("payrollUpdateDeleteIds", () => {
  it("returns original numeric ids that are no longer in the saved rows", () => {
    expect(
      payrollUpdateDeleteIds(
        [
          {
            id: "1",
            name: "Andrew",
            address: "0xabc",
            email: "",
            token: "USDC",
            network: "eth",
            amount: "100",
            netPay: "100",
          },
          {
            id: "2",
            name: "Hannah",
            address: "0xdef",
            email: "",
            token: "USDT",
            network: "near",
            amount: "50",
            netPay: "50",
          },
        ],
        [
          {
            id: "1",
            name: "Andrew",
            address: "0xabc",
            email: "",
            token: "USDC",
            network: "eth",
            amount: "120",
            netPay: "120",
          },
          {
            id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            name: "New",
            address: "0x123",
            email: "",
            token: "USDC",
            network: "eth",
            amount: "10",
            netPay: "10",
          },
        ],
      ),
    ).toEqual([2]);
  });
});

describe("recipientRowsToImportItems", () => {
  it("omits empty email and memo, and maps memo to description", () => {
    expect(
      recipientRowsToImportItems([
        {
          id: "1",
          name: "Andrew",
          address: "0xabc",
          email: "andrew@example.com",
          token: "USDC",
          network: "eth",
          amount: "100",
          netPay: "100",
          memo: "payroll",
        },
        {
          id: "2",
          name: "Hannah",
          address: "0xdef",
          email: "",
          token: "USDT",
          network: "near",
          amount: "50",
          netPay: "50",
        },
      ]),
    ).toEqual([
      {
        name: "Andrew",
        address: "0xabc",
        amount: "100",
        network: "eth",
        symbol: "USDC",
        email: "andrew@example.com",
        description: "payroll",
      },
      {
        name: "Hannah",
        address: "0xdef",
        amount: "50",
        network: "near",
        symbol: "USDT",
      },
    ]);
  });
});
