import { PAY_API_PREFIX } from "@/api/config";
import { apiNumber, apiText, asRecord } from "@/api/map";
import { http, httpBlob, type HttpQueryValue } from "@/lib/http";
import {
  HISTORY_TYPE,
  type HistoryExportQuery,
  type HistoryFilterQuery,
  type HistoryItem,
  type HistoryListResp,
  type HistoryQuery,
  type HistoryType,
} from "@/types/history";

const HISTORY_EXPORT_FILENAME = "transaction-history.csv";

function historyPath(isMember: boolean, exportCsv = false): string {
  const base = isMember
    ? `${PAY_API_PREFIX}/history`
    : `${PAY_API_PREFIX}/organizations/history`;
  return exportCsv ? `${base}/export` : base;
}

export function historyFilterQuery(
  params: HistoryFilterQuery,
): Record<string, HttpQueryValue> {
  return {
    organization_id: params.organizationId,
    q: params.q || undefined,
    type: params.type || undefined,
    status: params.status || undefined,
    source_network: params.sourceNetwork || undefined,
    source_symbol: params.sourceToken || undefined,
    destination_network: params.destNetwork || undefined,
    destination_symbol: params.destToken || undefined,
    start_time: params.startTime,
    end_time: params.endTime,
  };
}

export function historyListQuery(
  params: HistoryQuery,
): Record<string, HttpQueryValue> {
  return {
    ...historyFilterQuery(params),
    page: params.page,
    pageSize: params.pageSize,
  };
}

function mapHistoryType(value: unknown): HistoryType | null {
  const key = apiText(value).trim().toLowerCase();
  if (key === HISTORY_TYPE.Income || key === HISTORY_TYPE.Payout) return key;
  return null;
}

export function mapHistoryItem(raw: unknown): HistoryItem | null {
  const row = asRecord(raw);
  if (!row) return null;
  const id = apiText(row.payment_id ?? row.paymentId).trim();
  if (!id) return null;
  return {
    id,
    type: mapHistoryType(row.type),
    amount: apiText(row.source_amount ?? row.sourceAmount),
    token: apiText(row.source_symbol ?? row.sourceSymbol),
    network: apiText(row.source_network ?? row.sourceNetwork),
    destinationAmount: apiText(row.destination_amount ?? row.destinationAmount),
    destinationToken: apiText(row.destination_symbol ?? row.destinationSymbol),
    destinationNetwork: apiText(row.destination_network ?? row.destinationNetwork),
    payer: apiText(row.payer),
    recipient: apiText(row.recipient),
    txHash: apiText(row.tx_hash ?? row.txHash),
    destinationTxHash: apiText(row.destination_tx_hash ?? row.destinationTxHash),
    status: apiText(row.status).toLowerCase(),
    submittedAt: apiText(row.submitted_at ?? row.submittedAt)
      || apiText(row.created_at ?? row.createdAt),
  };
}

export function mapHistoryListResp(raw: unknown): HistoryListResp {
  const row = asRecord(raw) ?? {};
  const listSource = Array.isArray(row.list) ? row.list : [];
  const list = listSource.flatMap((item) => {
    const mapped = mapHistoryItem(item);
    return mapped ? [mapped] : [];
  });
  return {
    total: apiNumber(row.total) ?? list.length,
    totalPage: Math.max(1, apiNumber(row.total_page ?? row.totalPage) ?? 1),
    list,
  };
}

export async function getHistory(
  params: HistoryQuery,
  isMember: boolean,
): Promise<HistoryListResp> {
  const data = await http<unknown>(historyPath(isMember), {
    query: historyListQuery(params),
  });
  return mapHistoryListResp(data);
}

export function exportHistory(params: HistoryExportQuery, isMember: boolean) {
  return httpBlob(historyPath(isMember, true), {
    query: historyFilterQuery(params),
    fallbackFilename: HISTORY_EXPORT_FILENAME,
  });
}

export { historyPath };
