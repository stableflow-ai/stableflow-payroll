import { http } from "@/lib/http";
import { PAY_API_PREFIX } from "@/api/config";
import { apiNumber, apiText, asRecord } from "@/api/map";
import { ApiError } from "@/lib/api-error";
import { txExplorerUrl } from "@/config/chains";
import { EMPLOYEE_PAYMENT_TYPE } from "@/types/overview";
import type { MemberOpenRequest, MemberRecentPayment } from "@/types/overview";
import type {
  CreatePaymentRequestParam,
  PayCreateRequestParam,
  PayCreateRequestResp,
  PayRequestItem,
  PayWithdrawParam,
  PaymentRequestDefaultAddress,
  PaymentRequestItem,
  PaymentRequestListQuery,
  PaymentRequestListResp,
} from "@/types/request-payment";

export function mapPayRequestItem(raw: unknown): PayRequestItem {
  const row = asRecord(raw) ?? {};
  return {
    id: apiNumber(row.id) ?? 0,
    amount: apiText(row.amount),
    mode: apiText(row.mode),
    network: apiText(row.network),
    private_recipient_address: apiText(
      row.private_recipient_address ?? row.privateRecipientAddress,
    ),
    recipient_address: apiText(row.recipient_address ?? row.recipientAddress),
    status: apiText(row.status).toLowerCase(),
    token: apiText(row.token),
    name: apiText(row.name ?? row.payment_name ?? row.paymentName),
    memo: apiText(row.memo),
    created_at: apiText(row.created_at ?? row.createdAt),
    payer: apiText(row.payer ?? row.paid_address ?? row.paidAddress),
    paid_at: apiText(row.paid_at ?? row.paidAt),
    destination_tx_hash: apiText(
      row.destination_tx_hash ?? row.destinationTxHash ?? row.completed_tx_hash ?? row.completedTxHash,
    ),
    withdraw_tx_hash: apiText(
      row.withdraw_tx_hash ?? row.withdrawTxHash ?? row.withdrawed_tx_hash ?? row.withdrawedTxHash,
    ),
  };
}

function mapPayRequestList(data: unknown): PayRequestItem[] {
  if (Array.isArray(data)) return data.map(mapPayRequestItem);
  const row = asRecord(data);
  if (row && Array.isArray(row.list)) return row.list.map(mapPayRequestItem);
  if (row && Array.isArray(row.items)) return row.items.map(mapPayRequestItem);
  if (row && Array.isArray(row.payments)) return row.payments.map(mapPayRequestItem);
  if (row && Array.isArray(row.requests)) return row.requests.map(mapPayRequestItem);
  return [];
}

function mapCreateResp(raw: unknown): PayCreateRequestResp {
  const row = asRecord(raw) ?? {};
  const id = apiNumber(row.id);
  if (id == null || id <= 0) {
    throw new ApiError("Create request did not return an id", 400, "PAY_REQUEST");
  }
  return { id };
}

export function destinationTxHashFromRow(row: Record<string, unknown>): string {
  return apiText(
    row.destination_tx_hash ?? row.destinationTxHash ?? row.tx_hash ?? row.txHash,
  ).trim();
}

export function mapPaymentRequestItem(raw: unknown): PaymentRequestItem | null {
  const row = asRecord(raw);
  if (!row) return null;
  const batchId = apiNumber(row.batch_id ?? row.batchId);
  if (batchId == null || batchId <= 0) return null;
  return {
    batchId,
    title: apiText(row.title),
    userId: apiNumber(row.user_id ?? row.userId) ?? 0,
    name: apiText(row.name),
    email: apiText(row.email),
    purpose: apiText(row.purpose),
    description: apiText(row.description),
    amount: apiText(row.amount),
    symbol: apiText(row.symbol ?? row.token),
    network: apiText(row.network),
    recipient: apiText(row.recipient ?? row.recipient_address ?? row.recipientAddress),
    status: apiText(row.status).toLowerCase(),
    paymentId: apiText(row.payment_id ?? row.paymentId),
    payerUserId: apiNumber(row.payer_user_id ?? row.payerUserId) ?? 0,
    payer: apiText(row.payer),
    paidAt: apiText(row.paid_at ?? row.paidAt),
    createdAt: apiText(row.created_at ?? row.createdAt),
    updatedAt: apiText(row.updated_at ?? row.updatedAt),
    destinationTxHash: destinationTxHashFromRow(row),
  };
}

export function mapPaymentRequestList(raw: unknown): PaymentRequestItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((row) => {
    const item = mapPaymentRequestItem(row);
    return item ? [item] : [];
  });
}

export function mapPaymentRequestListResp(raw: unknown): PaymentRequestListResp {
  const row = asRecord(raw) ?? {};
  const listSource = Array.isArray(raw)
    ? raw
    : Array.isArray(row.list)
      ? row.list
      : [];
  const list = mapPaymentRequestList(listSource);
  return {
    list,
    total: apiNumber(row.total) ?? list.length,
    totalPage: Math.max(1, apiNumber(row.total_page ?? row.totalPage) ?? 1),
  };
}

export function mapOpenPaymentRequest(raw: unknown): MemberOpenRequest | null {
  const item = mapPaymentRequestItem(raw);
  if (!item) return null;
  const name = item.purpose.trim() || item.title.trim();
  return {
    id: String(item.batchId),
    name,
    createdAt: item.createdAt,
  };
}

export function mapOpenPaymentRequests(raw: unknown): MemberOpenRequest[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((row) => {
    const item = mapOpenPaymentRequest(row);
    return item ? [item] : [];
  });
}

function paymentTypeFromRaw(value: unknown) {
  const text = apiText(value).trim().toLowerCase();
  if (text === EMPLOYEE_PAYMENT_TYPE.Payout) return EMPLOYEE_PAYMENT_TYPE.Payout;
  return EMPLOYEE_PAYMENT_TYPE.Income;
}

export function mapRecentPaymentRequest(raw: unknown): MemberRecentPayment | null {
  const row = asRecord(raw);
  if (!row) return null;
  const paymentId = apiText(row.payment_id ?? row.paymentId).trim();
  const batchId = apiNumber(row.batch_id ?? row.batchId);
  const id = paymentId || (batchId != null && batchId > 0 ? String(batchId) : "");
  if (!id) return null;
  const destinationAmount = apiText(row.destination_amount ?? row.destinationAmount).trim();
  const sourceAmount = apiText(row.source_amount ?? row.sourceAmount).trim();
  const destinationSymbol = apiText(row.destination_symbol ?? row.destinationSymbol).trim();
  const sourceSymbol = apiText(row.source_symbol ?? row.sourceSymbol).trim();
  const destinationNetwork = apiText(row.destination_network ?? row.destinationNetwork).trim();
  const sourceNetwork = apiText(row.source_network ?? row.sourceNetwork).trim();
  const network = destinationNetwork || sourceNetwork;
  const destinationHash = apiText(row.destination_tx_hash ?? row.destinationTxHash).trim();
  const sourceHash = apiText(row.tx_hash ?? row.txHash).trim();
  return {
    id,
    type: paymentTypeFromRaw(row.type),
    purpose: apiText(row.memo),
    from: apiText(row.payer),
    to: apiText(row.recipient),
    amount: destinationAmount || sourceAmount,
    token: destinationSymbol || sourceSymbol,
    network,
    time:
      apiText(row.paid_at ?? row.paidAt).trim()
      || apiText(row.submitted_at ?? row.submittedAt).trim()
      || apiText(row.created_at ?? row.createdAt).trim(),
    status: apiText(row.status).toLowerCase(),
    explorerUrl: txExplorerUrl(network, destinationHash || sourceHash),
  };
}

export function mapRecentPaymentRequests(raw: unknown): MemberRecentPayment[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((row) => {
    const item = mapRecentPaymentRequest(row);
    return item ? [item] : [];
  });
}

export function mapDefaultAddresses(raw: unknown): PaymentRequestDefaultAddress[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const row = asRecord(item);
    if (!row) return [];
    const address = apiText(row.address).trim();
    const network = apiText(row.network).trim();
    if (!address || !network) return [];
    return [{ address, network }];
  });
}

function mapCreatePaymentRequestResp(raw: unknown): PaymentRequestItem {
  const item = mapPaymentRequestItem(raw);
  if (!item) {
    throw new ApiError("Create request did not return a batch id", 400, "PAY_REQUEST");
  }
  return item;
}

function createPaymentRequestBody(body: CreatePaymentRequestParam) {
  const description = body.description?.trim();
  return {
    amount: body.amount,
    description: description || undefined,
    network: body.network,
    organization_id: body.organizationId,
    purpose: body.purpose,
    recipient: body.recipient,
    symbol: body.symbol,
    set_default_address: body.setDefaultAddress,
  };
}

export function createPayRequest(body: PayCreateRequestParam) {
  return http<unknown>(`${PAY_API_PREFIX}/request`, { method: "POST", body }).then(mapCreateResp);
}

export function createPaymentRequest(body: CreatePaymentRequestParam) {
  return http<unknown>(`${PAY_API_PREFIX}/payment-requests`, {
    method: "POST",
    body: createPaymentRequestBody(body),
  }).then(mapCreatePaymentRequestResp);
}

export function getPayRequest(id: number, options?: { auth?: boolean }) {
  return http<unknown>(`${PAY_API_PREFIX}/request/${id}`, {
    auth: options?.auth ?? true,
  }).then(mapPayRequestItem);
}

export function disablePayRequest(id: number) {
  return http<void>(`${PAY_API_PREFIX}/request/${id}/disable`, { method: "POST" });
}

export function withdrawPayRequest(body: PayWithdrawParam) {
  return http<void>(`${PAY_API_PREFIX}/request/withdraw`, { method: "POST", body });
}

export function getRequestPayments() {
  return http<unknown>(`${PAY_API_PREFIX}/request/list`).then(mapPayRequestList);
}

export async function getRequestWithdrawCount(): Promise<number> {
  const data = asRecord(await http<unknown>(`${PAY_API_PREFIX}/request/withdraw/count`)) ?? {};
  return apiNumber(data.count) ?? 0;
}

export async function getPendingPaymentRequests(params: {
  organizationId: number;
  limit: number;
}) {
  return mapOpenPaymentRequests(
    await http<unknown>(`${PAY_API_PREFIX}/payment-requests/pending`, {
      query: {
        organization_id: params.organizationId,
        limit: params.limit,
      },
    }),
  );
}

export async function getRecentPaymentRequests(params: {
  organizationId: number;
  limit: number;
}) {
  return mapRecentPaymentRequests(
    await http<unknown>(`${PAY_API_PREFIX}/payment-requests/recent`, {
      query: {
        organization_id: params.organizationId,
        limit: params.limit,
      },
    }),
  );
}

export async function getPaymentRequests(
  params: PaymentRequestListQuery,
): Promise<PaymentRequestListResp> {
  return mapPaymentRequestListResp(
    await http<unknown>(`${PAY_API_PREFIX}/payment-requests`, {
      query: {
        organization_id: params.organizationId,
        page: params.page,
        pageSize: params.pageSize,
        status: params.status,
      },
    }),
  );
}

export async function getPaymentRequestDefaultAddresses(organizationId: number) {
  return mapDefaultAddresses(
    await http<unknown>(`${PAY_API_PREFIX}/payment-requests/default-addresses`, {
      query: { organization_id: organizationId },
    }),
  );
}
