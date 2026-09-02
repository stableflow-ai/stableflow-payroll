import { http, httpBlob } from "@/lib/http";
import { PAY_API_PREFIX } from "@/api/config";
import { getPayAnalytics } from "@/api/analytics";
import { apiNumber, apiText, asRecord } from "@/api/map";
import { ApiError } from "@/lib/api-error";
import type {
  PayBatchQuoteParam,
  PayBatchQuoteResp,
  PayBatchSubmitParam,
  PayBatchSwapResp,
  PayOverview,
  PayPaymentItem,
  PayPaymentsExportQuery,
  PayPaymentsQuery,
  PayPaymentsResp,
  PaySingleQuoteParam,
  PaySingleQuoteResp,
  PaySingleSubmitParam,
  PaySingleSwapParam,
  PaySingleSwapResp,
  PayBatchNearAction,
  PayBatchSwapTransaction,
  PayrollBatch,
  PayrollBatchPayment,
  PayrollCreateBatchParam,
  PayrollCreatePaymentParam,
  PayrollPayment,
  VolumePeriod,
  VolumePoint,
} from "@/types/payout";

export function singleQuote(body: PaySingleQuoteParam, options?: { auth?: boolean }) {
  return http<PaySingleQuoteResp>(`${PAY_API_PREFIX}/single/quote`, {
    method: "POST",
    body,
    auth: options?.auth ?? true,
  });
}

export function singleSwap(body: PaySingleSwapParam, options?: { auth?: boolean }) {
  return http<PaySingleSwapResp>(`${PAY_API_PREFIX}/single/swap`, {
    method: "POST",
    body,
    auth: options?.auth ?? true,
  });
}

export function singleSubmit(body: PaySingleSubmitParam, options?: { auth?: boolean }) {
  return http<void>(`${PAY_API_PREFIX}/single/submit`, {
    method: "POST",
    body,
    auth: options?.auth ?? true,
  });
}

export function batchQuote(body: PayBatchQuoteParam) {
  return http<PayBatchQuoteResp>(`${PAY_API_PREFIX}/batch/quote`, { method: "POST", body });
}

export function batchSwap(body: PayBatchQuoteParam) {
  return http<PayBatchSwapResp>(`${PAY_API_PREFIX}/batch/swap`, { method: "POST", body });
}

export function batchSubmit(body: PayBatchSubmitParam) {
  return http<void>(`${PAY_API_PREFIX}/batch/submit`, { method: "POST", body });
}

export function mapPaymentItem(raw: unknown): PayPaymentItem {
  const row = asRecord(raw) ?? {};
  const memo = apiText(row.memo);
  return {
    id: apiText(row.id),
    recipient: apiText(row.recipient),
    amount: apiText(row.amount),
    token: apiText(row.token),
    network: apiText(row.network),
    destinationAmount: apiText(row.destination_amount ?? row.destinationAmount),
    destinationToken: apiText(row.destination_token ?? row.destinationToken),
    destinationNetwork: apiText(row.destination_network ?? row.destinationNetwork),
    destinationTxHash: apiText(row.destination_txHash ?? row.destination_tx_hash ?? row.destinationTxHash),
    txHash: apiText(row.tx_hash ?? row.txHash),
    status: apiText(row.status).toLowerCase(),
    submittedAt: apiText(row.submitted_at ?? row.submittedAt),
    paidAt: apiText(row.paid_at ?? row.paidAt),
    memo: memo || null,
  };
}

function mapPaymentList(data: unknown): PayPaymentItem[] {
  if (Array.isArray(data)) return data.map(mapPaymentItem);
  const row = asRecord(data);
  if (row && Array.isArray(row.payments)) return row.payments.map(mapPaymentItem);
  if (row && Array.isArray(row.list)) return row.list.map(mapPaymentItem);
  if (row && Array.isArray(row.items)) return row.items.map(mapPaymentItem);
  return [];
}

function currentYearMonth(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function getPendingPayments(): Promise<PayPaymentItem[]> {
  return mapPaymentList(await http<unknown>(`${PAY_API_PREFIX}/payments/pending`));
}

export async function getRecentPayments(): Promise<PayPaymentItem[]> {
  return mapPaymentList(await http<unknown>(`${PAY_API_PREFIX}/payments/recent`));
}

export async function getPayOverview(): Promise<PayOverview> {
  try {
    const data = asRecord(await http<unknown>(`${PAY_API_PREFIX}/overview`)) ?? {};
    return {
      totalPayment: apiText(data.total_payment ?? data.totalPayment) || null,
      recipients: apiNumber(data.recipients),
    };
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) throw error;
    const analytics = await getPayAnalytics(currentYearMonth());
    return {
      totalPayment: analytics.stats.totalPayment,
      recipients: analytics.stats.recipients,
    };
  }
}

function volumeValue(row: Record<string, unknown>): number {
  return apiNumber(row.value ?? row.total_payment ?? row.totalPayment ?? row.amount) ?? 0;
}

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatVolumeDate(iso: string, period: VolumePeriod): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const month = MONTH_SHORT[date.getUTCMonth()];
  if (period === "month") return `${month} ${date.getUTCFullYear()}`;
  return `${month} ${date.getUTCDate()}`;
}

function volumeLabel(row: Record<string, unknown>, index: number, period: VolumePeriod): string {
  const explicit = apiText(row.label ?? row.date ?? row.period);
  if (explicit) return explicit;
  const fromStart = formatVolumeDate(apiText(row.start_at ?? row.startAt), period);
  return fromStart || String(index + 1);
}

export async function getPaymentVolume(period: VolumePeriod): Promise<VolumePoint[]> {
  const data = await http<unknown>(`${PAY_API_PREFIX}/payments/volume`, { query: { period } });
  const row = asRecord(data);
  const list = Array.isArray(data)
    ? data
    : Array.isArray(row?.list)
      ? row.list
      : Array.isArray(row?.items)
        ? row.items
        : Array.isArray(row?.points)
          ? row.points
          : [];
  return list.map((item, index) => {
    const point = asRecord(item) ?? {};
    return { label: volumeLabel(point, index, period), value: volumeValue(point) };
  });
}

export async function getPayments(params: PayPaymentsQuery): Promise<PayPaymentsResp> {
  const data = asRecord(await http<unknown>(`${PAY_API_PREFIX}/payments`, {
    query: {
      page: params.page,
      pageSize: params.pageSize,
      q: params.q || undefined,
      status: params.status || undefined,
      token: params.token || undefined,
      start_time: params.start_time,
      end_time: params.end_time,
    },
  })) ?? {};
  const list = mapPaymentList(data.list ?? data.items ?? data.payments);
  return {
    total: apiNumber(data.total) ?? list.length,
    totalPage: Math.max(1, apiNumber(data.total_page ?? data.totalPage) ?? 1),
    list,
  };
}

const PAYMENTS_EXPORT_FILENAME = "transaction-history.csv";

export function exportPayments(params: PayPaymentsExportQuery) {
  return httpBlob(`${PAY_API_PREFIX}/payments/export`, {
    query: {
      q: params.q || undefined,
      status: params.status || undefined,
      token: params.token || undefined,
      start_time: params.start_time,
      end_time: params.end_time,
    },
    fallbackFilename: PAYMENTS_EXPORT_FILENAME,
  });
}

export function mapPayrollPayment(raw: unknown): PayrollPayment {
  const row = asRecord(raw) ?? {};
  const memo = apiText(row.memo);
  return {
    paymentId: apiText(row.payment_id ?? row.paymentId),
    payUrl: apiText(row.pay_url ?? row.payUrl),
    paySessionId: apiText(row.pay_session_id ?? row.paySessionId),
    payPaymentId: apiText(row.pay_payment_id ?? row.payPaymentId),
    status: apiText(row.status).toLowerCase(),
    payer: apiText(row.payer),
    recipient: apiText(row.recipient),
    sourceAmount: apiText(row.source_amount ?? row.sourceAmount),
    sourceSymbol: apiText(row.source_symbol ?? row.sourceSymbol),
    sourceNetwork: apiText(row.source_network ?? row.sourceNetwork),
    destinationAmount: apiText(row.destination_amount ?? row.destinationAmount),
    destinationSymbol: apiText(row.destination_symbol ?? row.destinationSymbol),
    destinationNetwork: apiText(row.destination_network ?? row.destinationNetwork),
    destinationTxHash: apiText(row.destination_tx_hash ?? row.destination_txHash ?? row.destinationTxHash),
    txHash: apiText(row.tx_hash ?? row.txHash),
    memo: memo || null,
    paidAt: apiText(row.paid_at ?? row.paidAt),
    createdAt: apiText(row.created_at ?? row.createdAt),
    updatedAt: apiText(row.updated_at ?? row.updatedAt),
  };
}

/** Creates the hosted checkout session. The payer is sent to `payUrl`. */
export async function createPayrollPayment(
  body: PayrollCreatePaymentParam,
): Promise<PayrollPayment> {
  const payment = mapPayrollPayment(
    await http<unknown>(`${PAY_API_PREFIX}/payments`, { method: "POST", body }),
  );
  if (!payment.payUrl) {
    throw new ApiError("Payment link is missing from the response", 502, "NO_PAY_URL");
  }
  return payment;
}

export async function getPayrollPayment(paymentId: string): Promise<PayrollPayment> {
  return mapPayrollPayment(
    await http<unknown>(`${PAY_API_PREFIX}/payments/${encodeURIComponent(paymentId)}`),
  );
}

function mapPayrollBatchNearAction(raw: unknown): PayBatchNearAction | null {
  const row = asRecord(raw) ?? {};
  const params = asRecord(row.params) ?? {};
  const methodName = apiText(params.methodName ?? params.method_name);
  if (!methodName) return null;
  return {
    type: "FunctionCall",
    params: {
      methodName,
      args: asRecord(params.args) ?? {},
      gas: apiText(params.gas),
      deposit: apiText(params.deposit),
    },
  };
}

function mapPayrollBatchTransaction(raw: unknown): PayBatchSwapTransaction | null {
  const row = asRecord(raw);
  if (!row) return null;
  const approvals = Array.isArray(row.approvals)
    ? row.approvals.map((item) => apiText(item)).filter(Boolean)
    : null;
  const actions = Array.isArray(row.actions)
    ? row.actions.flatMap((item) => {
        const action = mapPayrollBatchNearAction(item);
        return action ? [action] : [];
      })
    : undefined;
  return {
    approvals,
    callData: apiText(row.callData ?? row.call_data),
    batch_contract: apiText(row.batch_contract ?? row.batchContract),
    receiverId: apiText(row.receiverId ?? row.receiver_id) || undefined,
    actions: actions?.length ? actions : undefined,
    serializedTransaction: apiText(row.serializedTransaction ?? row.serialized_transaction) || undefined,
    lastValidBlockHeight: apiNumber(row.lastValidBlockHeight ?? row.last_valid_block_height) ?? undefined,
  };
}

function hasBroadcastableBatchTx(tx: PayBatchSwapTransaction): boolean {
  if (tx.batch_contract.trim() && tx.callData.trim()) return true;
  if (tx.receiverId?.trim() && tx.actions?.length) return true;
  if (tx.serializedTransaction?.trim()) return true;
  return false;
}

export function mapPayrollBatchPayment(raw: unknown): PayrollBatchPayment {
  const row = asRecord(raw) ?? {};
  return {
    ...mapPayrollPayment(raw),
    batchId: apiText(row.batch_id ?? row.batchId),
    payDepositAddress: apiText(row.pay_deposit_address ?? row.payDepositAddress),
  };
}

export function mapPayrollBatch(raw: unknown): PayrollBatch {
  const row = asRecord(raw) ?? {};
  const payments = Array.isArray(row.payments)
    ? row.payments.map(mapPayrollBatchPayment)
    : [];
  const transaction = mapPayrollBatchTransaction(row.transaction) ?? {
    approvals: null,
    callData: "",
    batch_contract: "",
  };
  return {
    batchId: apiText(row.batch_id ?? row.batchId),
    deadline: apiText(row.deadline),
    payer: apiText(row.payer),
    sourceContract: apiText(row.source_contract ?? row.sourceContract),
    sourceDecimals: apiNumber(row.source_decimals ?? row.sourceDecimals),
    sourceNetwork: apiText(row.source_network ?? row.sourceNetwork),
    sourceSymbol: apiText(row.source_symbol ?? row.sourceSymbol),
    totalSourceAmount: apiText(row.total_source_amount ?? row.totalSourceAmount),
    totalSourceAmountRaw: apiText(row.total_source_amount_raw ?? row.totalSourceAmountRaw),
    transaction,
    payments,
  };
}

export async function createPayrollBatch(body: PayrollCreateBatchParam): Promise<PayrollBatch> {
  const batch = mapPayrollBatch(
    await http<unknown>(`${PAY_API_PREFIX}/batches`, { method: "POST", body }),
  );
  if (!hasBroadcastableBatchTx(batch.transaction)) {
    throw new ApiError("Batch transaction is missing from the response", 502, "NO_BATCH_TX");
  }
  return batch;
}

/** Status lookup for an existing batch. The batch page does not call this. */
export async function getPayrollBatchTransaction(batchId: string): Promise<PayrollBatch> {
  return mapPayrollBatch(
    await http<unknown>(`${PAY_API_PREFIX}/batches/${encodeURIComponent(batchId)}/transaction`),
  );
}
