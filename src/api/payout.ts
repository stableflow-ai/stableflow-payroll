import { http } from "@/lib/http";
import { PAY_API_PREFIX } from "@/api/config";
import { apiNumber, apiText, asRecord } from "@/api/map";
import { ApiError } from "@/lib/api-error";
import type {
  PayBatchNearAction,
  PayBatchSubmitParam,
  PayBatchSwapTransaction,
  PayrollBatch,
  PayrollBatchPayment,
  PayrollCreatePaymentParam,
  PayrollExecution,
  PayrollExecutionItem,
  PayrollPayment,
  PayrollPayoutSubmitResult,
} from "@/types/payout";

function apiBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === "true";
}

export function mapPayoutSubmit(raw: unknown): PayrollPayoutSubmitResult {
  const row = asRecord(raw) ?? {};
  const executionId = apiNumber(row.execution_id ?? row.executionId);
  if (executionId == null) {
    throw new ApiError("Execution id is missing from the response", 502, "NO_EXECUTION_ID");
  }
  return { executionId };
}

export async function batchSubmit(body: PayBatchSubmitParam): Promise<PayrollPayoutSubmitResult> {
  return mapPayoutSubmit(
    await http<unknown>(`${PAY_API_PREFIX}/payouts/submit`, { method: "POST", body }),
  );
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

export function isPayrollBatchBroadcastable(batch: PayrollBatch): boolean {
  return hasBroadcastableBatchTx(batch.transaction);
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
    quoteId: apiText(row.quote_id ?? row.quoteId),
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

export function mapPayrollExecutionItem(raw: unknown): PayrollExecutionItem | null {
  const row = asRecord(raw);
  if (!row) return null;
  const id = apiNumber(row.id);
  if (id == null) return null;
  return {
    id,
    executionId: apiNumber(row.execution_id ?? row.executionId) ?? 0,
    sourceItemId: apiNumber(row.source_item_id ?? row.sourceItemId) ?? 0,
    name: apiText(row.name),
    purpose: apiText(row.purpose),
    description: apiText(row.description),
    amount: apiText(row.amount),
    payer: apiText(row.payer),
    sourceAmount: apiText(row.source_amount ?? row.sourceAmount),
    sourceVolume: apiText(row.source_volume ?? row.sourceVolume),
    sourceSymbol: apiText(row.source_symbol ?? row.sourceSymbol),
    sourceNetwork: apiText(row.source_network ?? row.sourceNetwork),
    txHash: apiText(row.tx_hash ?? row.txHash),
    recipient: apiText(row.recipient),
    destinationAssetId: apiText(row.destination_asset_id ?? row.destinationAssetId),
    destinationAmount: apiText(row.destination_amount ?? row.destinationAmount),
    destinationVolume: apiText(row.destination_volume ?? row.destinationVolume),
    destinationSymbol: apiText(row.destination_symbol ?? row.destinationSymbol),
    destinationNetwork: apiText(row.destination_network ?? row.destinationNetwork),
    destinationTxHash: apiText(
      row.destination_tx_hash ?? row.destination_txHash ?? row.destinationTxHash,
    ),
    status: apiText(row.status).toLowerCase(),
    submittedAt: apiText(row.submitted_at ?? row.submittedAt),
    paidAt: apiText(row.paid_at ?? row.paidAt),
    createdAt: apiText(row.created_at ?? row.createdAt),
    updatedAt: apiText(row.updated_at ?? row.updatedAt),
  };
}

export function mapPayrollExecution(raw: unknown): PayrollExecution | null {
  const row = asRecord(raw);
  if (!row) return null;
  const executionId = apiNumber(row.execution_id ?? row.executionId);
  if (executionId == null) return null;
  const list = Array.isArray(row.list)
    ? row.list.flatMap((item) => {
        const mapped = mapPayrollExecutionItem(item);
        return mapped ? [mapped] : [];
      })
    : [];
  return {
    executionId,
    type: apiText(row.type).toLowerCase(),
    title: apiText(row.title),
    total: apiNumber(row.total) ?? list.length,
    processed: apiNumber(row.processed) ?? 0,
    created: apiNumber(row.created) ?? 0,
    processing: apiNumber(row.processing) ?? 0,
    completed: apiNumber(row.completed) ?? 0,
    failed: apiNumber(row.failed) ?? 0,
    expired: apiNumber(row.expired) ?? 0,
    finished: apiBoolean(row.finished),
    list,
  };
}

export async function getPayrollExecution(
  executionId: number,
  organizationId: number,
): Promise<PayrollExecution> {
  const mapped = mapPayrollExecution(
    await http<unknown>(
      `${PAY_API_PREFIX}/executions/${encodeURIComponent(String(executionId))}`,
      { query: { organization_id: organizationId } },
    ),
  );
  if (!mapped) {
    throw new ApiError("Execution is missing from the response", 502, "NO_EXECUTION");
  }
  return mapped;
}
