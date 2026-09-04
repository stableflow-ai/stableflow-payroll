import { subDays } from "date-fns";
import type {
  ExpenseChartRange,
  ExpensePayoutStatus,
  ExpenseRowAction,
} from "@/views/expense/config";
import {
  EXPENSE_CHART_RANGE,
  EXPENSE_PAYOUT_STATUS,
  EXPENSE_ROW_ACTION,
} from "@/views/expense/config";

export type ExpenseChartPoint = {
  label: string;
  value: number;
};

export type ExpenseRecentPayout = {
  id: string;
  amount: string;
  token: string;
  network: string;
  recipient: string;
  status: ExpensePayoutStatus;
};

export type ExpenseOpenRow = {
  id: string;
  name: string;
  purpose: string;
  receiptName: string;
  expense: string;
  address: string;
  token: string;
  network: string;
  amount: string;
  action: ExpenseRowAction;
};

export type ExpenseOpenList = {
  total: string;
  count: number;
  rows: ExpenseOpenRow[];
};

export type ExpenseHistoryRow = {
  id: string;
  name: string;
  purpose: string;
  description: string | null;
  receiptName: string | null;
  expense: string;
  address: string;
  token: string;
  network: string;
  amount: string;
  status: ExpensePayoutStatus;
  txHash: string | null;
  paidAt: string;
};

export type ExpenseOverview = {
  totalExpense: string;
  totalChangePercent: number | null;
  expensedCount: number;
  expensedChangePercent: number | null;
  expenseCount: number;
  expenseChangePercent: number | null;
  chartRange: ExpenseChartRange;
  chartPeriodLabel: string;
  chartCurrentValue: string;
  chartPoints: ExpenseChartPoint[];
  recentPayouts: ExpenseRecentPayout[];
  open: ExpenseOpenList;
  history: ExpenseHistoryRow[];
};

const HISTORY_ADDRESS = "0x253000000000000000000000000000000ef602";
const HISTORY_RECEIPT = "Invoice of conference andrew.pdf";

function historyRow(
  id: string,
  fields: Pick<ExpenseHistoryRow, "expense" | "amount" | "status" | "paidAt"> &
    Partial<Pick<ExpenseHistoryRow, "description" | "receiptName" | "txHash">>,
): ExpenseHistoryRow {
  const receiptName =
    fields.description != null ? null : (fields.receiptName ?? HISTORY_RECEIPT);
  return {
    id,
    name: "Andrew",
    purpose: "Conference Travel",
    description: fields.description ?? null,
    receiptName,
    expense: fields.expense,
    address: HISTORY_ADDRESS,
    token: "USDC",
    network: "near",
    amount: fields.amount,
    status: fields.status,
    txHash: fields.txHash ?? (fields.status === EXPENSE_PAYOUT_STATUS.Paid ? `tx-${id}` : null),
    paidAt: fields.paidAt,
  };
}

export function getExpenseOverviewMock(): ExpenseOverview {
  return {
    totalExpense: "5320",
    totalChangePercent: 10,
    expensedCount: 9,
    expensedChangePercent: 20,
    expenseCount: 23,
    expenseChangePercent: -2,
    chartRange: EXPENSE_CHART_RANGE.Months6,
    chartPeriodLabel: "August, 2026",
    chartCurrentValue: "5320",
    chartPoints: [
      { label: "Mar", value: 4_300 },
      { label: "Apr", value: 5_200 },
      { label: "May", value: 4_000 },
      { label: "Jun", value: 4_300 },
      { label: "Jul", value: 3_300 },
      { label: "Aug", value: 3_100 },
    ],
    recentPayouts: [
      {
        id: "p1",
        amount: "1000",
        token: "USDT",
        network: "base",
        recipient: "0x54100000000000000000000000000000008dc1",
        status: EXPENSE_PAYOUT_STATUS.Pending,
      },
    ],
    open: {
      total: "1253.02",
      count: 3,
      rows: [
        {
          id: "r1",
          name: "Andrew",
          purpose: "Conference Travel",
          receiptName: "Invoice of conference addrew.pdf",
          expense: "800",
          address: "0x253000000000000000000000000000000ef602",
          token: "USDC",
          network: "near",
          amount: "800",
          action: EXPENSE_ROW_ACTION.Paying,
        },
        {
          id: "r2",
          name: "Andrew",
          purpose: "Conference Travel",
          receiptName: "Invoice of conference addrew.pdf",
          expense: "252.02",
          address: "0x253000000000000000000000000000000ef602",
          token: "USDC",
          network: "near",
          amount: "252.02",
          action: EXPENSE_ROW_ACTION.PayNow,
        },
        {
          id: "r3",
          name: "Andrew",
          purpose: "Conference Travel",
          receiptName: "Invoice of conference addrew.pdf",
          expense: "201.78",
          address: "0x253000000000000000000000000000000ef602",
          token: "USDC",
          network: "near",
          amount: "201.78",
          action: EXPENSE_ROW_ACTION.PayNow,
        },
      ],
    },
    history: [
      historyRow("h1", {
        expense: "800",
        amount: "800",
        status: EXPENSE_PAYOUT_STATUS.Paid,
        paidAt: subDays(new Date(), 1).toISOString(),
      }),
      historyRow("h2", {
        expense: "252.02",
        amount: "252.02",
        status: EXPENSE_PAYOUT_STATUS.Paid,
        paidAt: subDays(new Date(), 2).toISOString(),
        description: "Conference Ticket",
        receiptName: null,
      }),
      historyRow("h3", {
        expense: "201.78",
        amount: "201.78",
        status: EXPENSE_PAYOUT_STATUS.Failed,
        paidAt: subDays(new Date(), 5).toISOString(),
      }),
      historyRow("h4", {
        expense: "252.02",
        amount: "252.02",
        status: EXPENSE_PAYOUT_STATUS.Paid,
        paidAt: subDays(new Date(), 7).toISOString(),
      }),
      historyRow("h5", {
        expense: "252.02",
        amount: "252.02",
        status: EXPENSE_PAYOUT_STATUS.Paid,
        paidAt: subDays(new Date(), 9).toISOString(),
        description: "Airplane Ticket",
        receiptName: null,
      }),
      historyRow("h6", {
        expense: "252.02",
        amount: "252.02",
        status: EXPENSE_PAYOUT_STATUS.Paid,
        paidAt: subDays(new Date(), 11).toISOString(),
      }),
      historyRow("h7", {
        expense: "252.02",
        amount: "252.02",
        status: EXPENSE_PAYOUT_STATUS.Paid,
        paidAt: subDays(new Date(), 13).toISOString(),
      }),
      historyRow("h8", {
        expense: "252.02",
        amount: "252.02",
        status: EXPENSE_PAYOUT_STATUS.Paid,
        paidAt: subDays(new Date(), 15).toISOString(),
      }),
      historyRow("h9", {
        expense: "252.02",
        amount: "252.02",
        status: EXPENSE_PAYOUT_STATUS.Paid,
        paidAt: subDays(new Date(), 18).toISOString(),
      }),
    ],
  };
}
