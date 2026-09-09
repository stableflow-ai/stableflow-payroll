export const HISTORY_STATUS = {
  Created: "created",
  Processing: "processing",
  Completed: "completed",
  Failed: "failed",
  Expired: "expired",
} as const;

export type HistoryStatus = (typeof HISTORY_STATUS)[keyof typeof HISTORY_STATUS];

export const HISTORY_TYPE = {
  Income: "income",
  Payout: "payout",
} as const;

export type HistoryType = (typeof HISTORY_TYPE)[keyof typeof HISTORY_TYPE];

export interface HistoryItem {
  id: string;
  type: HistoryType | null;
  amount: string;
  token: string;
  network: string;
  destinationAmount: string;
  destinationToken: string;
  destinationNetwork: string;
  payer: string;
  recipient: string;
  txHash: string;
  destinationTxHash: string;
  status: string;
  submittedAt: string;
}

export interface HistoryFilterQuery {
  organizationId: number;
  q?: string;
  type?: HistoryType;
  status?: HistoryStatus;
  sourceNetwork?: string;
  sourceToken?: string;
  destNetwork?: string;
  destToken?: string;
  startTime?: number;
  endTime?: number;
}

export interface HistoryQuery extends HistoryFilterQuery {
  page: number;
  pageSize: number;
}

export type HistoryExportQuery = HistoryFilterQuery;

export interface HistoryListResp {
  total: number;
  totalPage: number;
  list: HistoryItem[];
}
