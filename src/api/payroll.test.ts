import { describe, expect, it } from "vitest";
import {
  mapPayrollCurrentStats,
  mapPayrollHistoryDetail,
  mapPayrollHistoryDetailRow,
  mapPayrollHistoryResp,
  mapPayrollHistoryRun,
  mapPayrollImportResp,
  mapPayrollNextRun,
  mapPayrollRecentPayout,
  mapPayrollTotalPayoutPoint,
} from "./payroll";

describe("mapPayrollCurrentStats", () => {
  it("maps snake_case stats and parses change percents", () => {
    expect(
      mapPayrollCurrentStats({
        total_payout: "36000",
        total_payout_change: "+8%",
        payments: 12,
        payments_change: "0",
        average_salary: "3220",
        max_salary: "8500",
      }),
    ).toEqual({
      totalPayout: "36000",
      totalPayoutChange: 8,
      payments: 12,
      paymentsChange: 0,
      averageSalary: "3220",
      maxSalary: "8500",
    });
  });

  it("treats missing change as null", () => {
    expect(mapPayrollCurrentStats({}).totalPayoutChange).toBeNull();
  });
});

describe("mapPayrollTotalPayoutPoint", () => {
  it("maps time and volume", () => {
    expect(mapPayrollTotalPayoutPoint({ time: "2026-07-01", volume: "35500" })).toEqual({
      time: "2026-07-01",
      volume: "35500",
    });
  });
});

describe("mapPayrollRecentPayout", () => {
  it("maps destination fields and completed status to paid", () => {
    expect(
      mapPayrollRecentPayout({
        id: 9,
        destination_amount: "2000",
        destination_symbol: "USDC",
        destination_network: "arb",
        recipient: "0xabc",
        status: "completed",
      }),
    ).toEqual({
      id: "9",
      amount: "2000",
      token: "USDC",
      network: "arb",
      recipient: "0xabc",
      status: "paid",
    });
  });
});

describe("mapPayrollHistoryRun", () => {
  it("maps monthly history fields and titles from ISO months", () => {
    expect(
      mapPayrollHistoryRun({
        execution_id: 4,
        month: "2026-08-01",
        recipients: 12,
        total_payout: "35000",
        transactions: 11,
        execution_time: "2026-09-01T00:00:00Z",
      }),
    ).toEqual({
      id: "4",
      title: "August Payroll",
      status: "paid",
      paidCount: 11,
      recipientCount: 12,
      totalPayout: "35000",
      transactionCount: 11,
      failedCount: 0,
      executedAt: "2026-09-01T00:00:00Z",
    });
  });

  it("marks a run pending when there are recipients but no transactions", () => {
    expect(
      mapPayrollHistoryRun({
        execution_id: 1,
        month: "2026-09",
        recipients: 12,
        transactions: 0,
      }).status,
    ).toBe("pending");
  });
});

describe("mapPayrollHistoryResp", () => {
  it("maps pagination fields and list items", () => {
    expect(
      mapPayrollHistoryResp({
        total: 12,
        total_page: 2,
        list: [
          {
            execution_id: 4,
            month: "2026-08-01",
            recipients: 12,
            total_payout: "35000",
            transactions: 11,
            execution_time: "2026-09-01T00:00:00Z",
          },
        ],
      }),
    ).toMatchObject({
      total: 12,
      totalPage: 2,
      list: [{ id: "4", title: "August Payroll" }],
    });
  });
});

describe("mapPayrollHistoryDetailRow", () => {
  it("maps destination fields, recipient address, and completed status to paid", () => {
    expect(
      mapPayrollHistoryDetailRow({
        id: 9,
        name: "Andrew",
        email: "andrew@example.com",
        recipient: "0xabc",
        amount: "5000",
        net_pay: "5500",
        destination_symbol: "USDC",
        destination_network: "near",
        destination_tx_hash: "0xhash",
        status: "completed",
      }),
    ).toEqual({
      id: "9",
      name: "Andrew",
      email: "andrew@example.com",
      address: "0xabc",
      token: "USDC",
      network: "near",
      amount: "5000",
      netPay: "5500",
      status: "paid",
      txHash: "0xhash",
    });
  });
});

describe("mapPayrollHistoryDetail", () => {
  it("maps summary fields and counts failed rows", () => {
    expect(
      mapPayrollHistoryDetail({
        execution_id: 4,
        month: "2026-07-01",
        recipients: 12,
        total_payout: "35000",
        transactions: 11,
        execution_time: "2026-08-01",
        list: [
          { id: 1, status: "failed", amount: "5000", recipient: "0x1" },
          { id: 2, status: "completed", amount: "3000", recipient: "0x2" },
        ],
      }),
    ).toMatchObject({
      id: "4",
      title: "July Payroll",
      totalPayout: "35000",
      recipientCount: 12,
      transactionCount: 11,
      failedCount: 1,
      paidCount: 1,
      executedAt: "2026-08-01",
      rows: [{ status: "failed" }, { status: "paid" }],
    });
  });
});

describe("mapPayrollNextRun", () => {
  it("maps next payroll rows and returns null when the list is empty", () => {
    expect(mapPayrollNextRun({ list: [] })).toBeNull();
    expect(
      mapPayrollNextRun({
        total_payout: "273500",
        recipients: 2,
        payment_date: "2026-10-01",
        payroll_day_type: "day_of_month",
        payroll_day: 15,
        list: [
          {
            id: 1,
            name: "Andrew",
            address: "0xabc",
            email: "andrew@example.com",
            symbol: "USDC",
            network: "near",
            amount: "5000",
            net_pay: "5000",
          },
        ],
      }),
    ).toEqual({
      totalPayout: "273500",
      recipients: 2,
      payDate: "2026-10-01",
      payrollDayType: "day_of_month",
      payrollDay: 15,
      rows: [
        {
          id: "1",
          name: "Andrew",
          address: "0xabc",
          email: "andrew@example.com",
          token: "USDC",
          network: "near",
          amount: "5000",
          netPay: "5000",
        },
      ],
    });
  });
});

describe("mapPayrollImportResp", () => {
  it("maps batch_id and count", () => {
    expect(mapPayrollImportResp({ batch_id: 12, count: 4 })).toEqual({
      batchId: 12,
      count: 4,
    });
  });
});
