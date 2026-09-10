import type {
  ExpenseDraftRow,
  ExpenseHistoryExportQuery,
  ExpenseHistoryQuery,
  ExpenseHistoryResp,
  ExpenseHistoryRow,
  ExpenseImportItem,
  ExpenseImportResp,
  ExpenseOpenBatch,
  ExpenseOpenList,
  ExpenseOpenRow,
  ExpenseRecentPayout,
  ExpenseRowAction,
  ExpenseTotalPayoutPeriod,
  ExpenseTotalPayoutPoint,
} from "@/types/expense";

export const OPERATION_CATEGORY = {
  Office: "office",
  Procurement: "procurement",
  Outsourcing: "outsourcing",
  KolMkt: "kolmkt",
  Grants: "grants",
  OtcTreasury: "otctreasury",
} as const;

export type KnownOperationCategory =
  (typeof OPERATION_CATEGORY)[keyof typeof OPERATION_CATEGORY];

export const OPERATION_STATUS = {
  Active: "active",
  Disabled: "disabled",
} as const;

export type OperationStatus =
  (typeof OPERATION_STATUS)[keyof typeof OPERATION_STATUS];

export const OPERATION_TOTAL_PAYOUT_PERIOD = {
  Day: "day",
  Week: "week",
  Month: "month",
} as const;

export type OperationTotalPayoutPeriod = ExpenseTotalPayoutPeriod;

export interface OperationCatalogItem {
  id: number;
  category: string;
  name: string;
  icon: string;
  description: string;
  added: boolean;
  status: string;
}

export interface OperationCurrentStats {
  totalPayout: string;
  totalChangePercent: number | null;
  payouts: number;
  payoutsChangePercent: number | null;
}

export interface OperationCurrentStatsQuery {
  category: string;
  organizationId: number;
  timezone: string;
}

export type OperationTotalPayoutPoint = ExpenseTotalPayoutPoint;

export interface OperationTotalPayoutQuery {
  category: string;
  organizationId: number;
  period: OperationTotalPayoutPeriod;
  timezone: string;
}

export type OperationRecentPayout = ExpenseRecentPayout;

export interface OperationRecentPayoutsQuery {
  category: string;
  organizationId: number;
  limit: number;
}

export type OperationRowAction = ExpenseRowAction;
export type OperationOpenRow = ExpenseOpenRow;
export type OperationOpenBatch = ExpenseOpenBatch;
export type OperationOpenList = ExpenseOpenList;

export interface OperationOpenQuery {
  category: string;
  organizationId: number;
}

export type OperationHistoryRow = ExpenseHistoryRow;

export interface OperationHistoryQuery
  extends Omit<ExpenseHistoryQuery, "search"> {
  category: string;
}

export interface OperationHistoryExportQuery
  extends Omit<ExpenseHistoryExportQuery, "search"> {
  category: string;
}

export type OperationHistoryResp = ExpenseHistoryResp;

export type OperationDraftRow = ExpenseDraftRow;
export type OperationImportItem = ExpenseImportItem;

export const OPERATION_IMPORT_LIMITS = {
  category: 30,
  title: 100,
  name: 50,
  address: 128,
  email: 100,
  network: 32,
  symbol: 32,
  purpose: 100,
  description: 5000,
} as const;

export interface OperationImportParam {
  organizationId: number;
  category: string;
  title: string;
  items: OperationImportItem[];
}

export type OperationImportResp = ExpenseImportResp;

export interface OperationPayQuoteParam {
  organization_id: number;
  batch_id: number;
  category: string;
  payer: string;
  source_network: string;
  source_symbol: string;
  notification?: string;
}

export function isOperationNavEnabled(item: Pick<OperationCatalogItem, "added" | "status">): boolean {
  return item.added && item.status === OPERATION_STATUS.Active;
}
