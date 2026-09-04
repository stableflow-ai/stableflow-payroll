import { subDays } from "date-fns";
import type {
  ReimbursementChartRange,
  ReimbursementPayoutStatus,
  ReimbursementRowAction,
} from "@/views/reimbursement/config";
import {
  REIMBURSEMENT_CHART_RANGE,
  REIMBURSEMENT_PAYOUT_STATUS,
  REIMBURSEMENT_ROW_ACTION,
} from "@/views/reimbursement/config";

export type ReimbursementChartPoint = {
  label: string;
  value: number;
};

export type ReimbursementRecentPayout = {
  id: string;
  amount: string;
  token: string;
  network: string;
  recipient: string;
  status: ReimbursementPayoutStatus;
};

export type ReimbursementOpenRow = {
  id: string;
  name: string;
  purpose: string;
  receiptName: string;
  reimbursement: string;
  address: string;
  token: string;
  network: string;
  amount: string;
  action: ReimbursementRowAction;
};

export type ReimbursementOpenList = {
  total: string;
  count: number;
  rows: ReimbursementOpenRow[];
};

export type ReimbursementHistoryRow = {
  id: string;
  name: string;
  purpose: string;
  description: string | null;
  receiptName: string | null;
  reimbursement: string;
  address: string;
  token: string;
  network: string;
  amount: string;
  status: ReimbursementPayoutStatus;
  txHash: string | null;
  paidAt: string;
};

export type ReimbursementOverview = {
  totalReimbursement: string;
  totalChangePercent: number | null;
  reimbursedCount: number;
  reimbursedChangePercent: number | null;
  reimbursementCount: number;
  reimbursementChangePercent: number | null;
  chartRange: ReimbursementChartRange;
  chartPeriodLabel: string;
  chartCurrentValue: string;
  chartPoints: ReimbursementChartPoint[];
  recentPayouts: ReimbursementRecentPayout[];
  open: ReimbursementOpenList;
  history: ReimbursementHistoryRow[];
};

const HISTORY_ADDRESS = "0x253000000000000000000000000000000ef602";
const HISTORY_RECEIPT = "Invoice of conference andrew.pdf";

function historyRow(
  id: string,
  fields: Pick<ReimbursementHistoryRow, "reimbursement" | "amount" | "status" | "paidAt"> &
    Partial<Pick<ReimbursementHistoryRow, "description" | "receiptName" | "txHash">>,
): ReimbursementHistoryRow {
  const receiptName =
    fields.description != null ? null : (fields.receiptName ?? HISTORY_RECEIPT);
  return {
    id,
    name: "Andrew",
    purpose: "Conference Travel",
    description: fields.description ?? null,
    receiptName,
    reimbursement: fields.reimbursement,
    address: HISTORY_ADDRESS,
    token: "USDC",
    network: "near",
    amount: fields.amount,
    status: fields.status,
    txHash: fields.txHash ?? (fields.status === REIMBURSEMENT_PAYOUT_STATUS.Paid ? `tx-${id}` : null),
    paidAt: fields.paidAt,
  };
}

export function getReimbursementOverviewMock(): ReimbursementOverview {
  return {
    totalReimbursement: "5320",
    totalChangePercent: 10,
    reimbursedCount: 9,
    reimbursedChangePercent: 20,
    reimbursementCount: 23,
    reimbursementChangePercent: -2,
    chartRange: REIMBURSEMENT_CHART_RANGE.Months6,
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
        status: REIMBURSEMENT_PAYOUT_STATUS.Pending,
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
          reimbursement: "800",
          address: "0x253000000000000000000000000000000ef602",
          token: "USDC",
          network: "near",
          amount: "800",
          action: REIMBURSEMENT_ROW_ACTION.Paying,
        },
        {
          id: "r2",
          name: "Andrew",
          purpose: "Conference Travel",
          receiptName: "Invoice of conference addrew.pdf",
          reimbursement: "252.02",
          address: "0x253000000000000000000000000000000ef602",
          token: "USDC",
          network: "near",
          amount: "252.02",
          action: REIMBURSEMENT_ROW_ACTION.PayNow,
        },
        {
          id: "r3",
          name: "Andrew",
          purpose: "Conference Travel",
          receiptName: "Invoice of conference addrew.pdf",
          reimbursement: "201.78",
          address: "0x253000000000000000000000000000000ef602",
          token: "USDC",
          network: "near",
          amount: "201.78",
          action: REIMBURSEMENT_ROW_ACTION.PayNow,
        },
      ],
    },
    history: [
      historyRow("h1", {
        reimbursement: "800",
        amount: "800",
        status: REIMBURSEMENT_PAYOUT_STATUS.Paid,
        paidAt: subDays(new Date(), 1).toISOString(),
      }),
      historyRow("h2", {
        reimbursement: "252.02",
        amount: "252.02",
        status: REIMBURSEMENT_PAYOUT_STATUS.Paid,
        paidAt: subDays(new Date(), 2).toISOString(),
        description: "Conference Ticket",
        receiptName: null,
      }),
      historyRow("h3", {
        reimbursement: "201.78",
        amount: "201.78",
        status: REIMBURSEMENT_PAYOUT_STATUS.Failed,
        paidAt: subDays(new Date(), 5).toISOString(),
      }),
      historyRow("h4", {
        reimbursement: "252.02",
        amount: "252.02",
        status: REIMBURSEMENT_PAYOUT_STATUS.Paid,
        paidAt: subDays(new Date(), 7).toISOString(),
      }),
      historyRow("h5", {
        reimbursement: "252.02",
        amount: "252.02",
        status: REIMBURSEMENT_PAYOUT_STATUS.Paid,
        paidAt: subDays(new Date(), 9).toISOString(),
        description: "Airplane Ticket",
        receiptName: null,
      }),
      historyRow("h6", {
        reimbursement: "252.02",
        amount: "252.02",
        status: REIMBURSEMENT_PAYOUT_STATUS.Paid,
        paidAt: subDays(new Date(), 11).toISOString(),
      }),
      historyRow("h7", {
        reimbursement: "252.02",
        amount: "252.02",
        status: REIMBURSEMENT_PAYOUT_STATUS.Paid,
        paidAt: subDays(new Date(), 13).toISOString(),
      }),
      historyRow("h8", {
        reimbursement: "252.02",
        amount: "252.02",
        status: REIMBURSEMENT_PAYOUT_STATUS.Paid,
        paidAt: subDays(new Date(), 15).toISOString(),
      }),
      historyRow("h9", {
        reimbursement: "252.02",
        amount: "252.02",
        status: REIMBURSEMENT_PAYOUT_STATUS.Paid,
        paidAt: subDays(new Date(), 18).toISOString(),
      }),
    ],
  };
}
