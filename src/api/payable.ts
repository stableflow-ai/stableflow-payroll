import { PAY_API_PREFIX } from "@/api/config";
import { apiNumber, apiText, asRecord } from "@/api/map";
import { isPayrollBatchBroadcastable, mapPayrollBatch } from "@/api/payout";
import { ApiError } from "@/lib/api-error";
import { http } from "@/lib/http";
import {
  PAYABLE_TYPE,
  isOperationPayableType,
  type Payable,
  type PayableItem,
  type PayablePayBaseParam,
  type PayablePayRequest,
  type PayableType,
  type PayrollPayParam,
} from "@/types/payable";
import type { PayablePayQuote, PayablePayQuoteBatch } from "@/types/payout";

function mapPayableItem(raw: unknown): PayableItem | null {
  const row = asRecord(raw);
  if (!row) return null;
  const id = apiNumber(row.id);
  if (id == null) return null;
  return {
    id,
    name: apiText(row.name),
    email: apiText(row.email),
    address: apiText(row.address),
    network: apiText(row.network),
    symbol: apiText(row.symbol),
    amount: apiText(row.amount),
    volume: apiText(row.volume),
    netPay: apiText(row.net_pay ?? row.netPay),
    purpose: apiText(row.purpose ?? row.description),
    status: apiText(row.status),
  };
}

function payableKeyFromRow(
  type: PayableType,
  periodMonth: string,
  batchId: number | null,
): Payable["key"] | null {
  if (type === PAYABLE_TYPE.Payroll) {
    if (!periodMonth) return null;
    return { type: PAYABLE_TYPE.Payroll, periodMonth };
  }
  if (!type || batchId == null) return null;
  return { type, batchId };
}

export function mapPayable(raw: unknown): Payable | null {
  const row = asRecord(raw);
  if (!row) return null;
  const type = apiText(row.type).trim();
  if (!type) return null;
  const periodMonth = apiText(row.period_month ?? row.periodMonth).trim();
  const batchId = apiNumber(row.batch_id ?? row.batchId);
  const key = payableKeyFromRow(type, periodMonth, batchId);
  if (!key) return null;
  const items = Array.isArray(row.list)
    ? row.list.flatMap((item) => {
        const mapped = mapPayableItem(item);
        return mapped ? [mapped] : [];
      })
    : [];
  return {
    key,
    type,
    title: apiText(row.title),
    totalPayout: apiText(row.total_payout ?? row.totalPayout),
    totalCount: apiNumber(row.total_count ?? row.totalCount) ?? items.length,
    paymentDate: apiText(row.payment_date ?? row.paymentDate),
    periodMonth,
    batchId: batchId ?? 0,
    items,
  };
}

export function mapPayables(raw: unknown): Payable[] {
  const row = asRecord(raw);
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(row?.list)
      ? row.list
      : Array.isArray(row?.data)
        ? row.data
        : [];
  return list.flatMap((item) => {
    const mapped = mapPayable(item);
    return mapped ? [mapped] : [];
  });
}

export async function getPayables(
  organizationId: number,
  timezone: string,
): Promise<Payable[]> {
  return mapPayables(
    await http<unknown>(`${PAY_API_PREFIX}/payables`, {
      query: {
        organization_id: organizationId,
        timezone,
      },
    }),
  );
}

function mapPayablePayQuoteBatch(
  raw: unknown,
  quoteId: string,
): PayablePayQuoteBatch | null {
  const row = asRecord(raw);
  if (!row) return null;
  const nested = row.batch ?? row;
  const batch = mapPayrollBatch(nested);
  const quoteBatchId =
    apiText(row.quote_batch_id ?? row.quoteBatchId)
    || batch.batchId
    || quoteId;
  if (!quoteBatchId || !isPayrollBatchBroadcastable(batch)) return null;
  return {
    quoteBatchId,
    batch: { ...batch, quoteId },
  };
}

export function mapPayablePayResponse(raw: unknown): PayablePayQuote {
  const row = asRecord(raw) ?? {};
  const quoteId = apiText(row.quote_id ?? row.quoteId);
  if (!quoteId) {
    throw new ApiError("Quote id is missing from the response", 502, "NO_QUOTE_ID");
  }
  const rawBatches = Array.isArray(row.batches) ? row.batches : null;
  const batches: PayablePayQuoteBatch[] = [];
  if (rawBatches) {
    for (const item of rawBatches) {
      const mapped = mapPayablePayQuoteBatch(item, quoteId);
      if (!mapped) {
        throw new ApiError("Batch transaction is missing from the response", 502, "NO_BATCH_TX");
      }
      batches.push(mapped);
    }
  } else {
    const mapped = mapPayablePayQuoteBatch(row.batch ?? raw, quoteId);
    if (!mapped) {
      throw new ApiError("Batch transaction is missing from the response", 502, "NO_BATCH_TX");
    }
    batches.push(mapped);
  }
  if (!batches.length) {
    throw new ApiError("Batch transaction is missing from the response", 502, "NO_BATCH_TX");
  }
  return { quoteId, batches };
}

export async function payPayrollSalaries(body: PayrollPayParam): Promise<PayablePayQuote> {
  return mapPayablePayResponse(
    await http<unknown>(`${PAY_API_PREFIX}/salaries/pay/quote`, { method: "POST", body }),
  );
}

export async function payExpenseBatch(
  batchId: number,
  body: PayablePayBaseParam,
): Promise<PayablePayQuote> {
  return mapPayablePayResponse(
    await http<unknown>(
      `${PAY_API_PREFIX}/expenses/${encodeURIComponent(String(batchId))}/pay/quote`,
      {
        method: "POST",
        body,
      },
    ),
  );
}

export async function payBonusBatch(
  batchId: number,
  body: PayablePayBaseParam,
): Promise<PayablePayQuote> {
  return mapPayablePayResponse(
    await http<unknown>(
      `${PAY_API_PREFIX}/bonuses/${encodeURIComponent(String(batchId))}/pay/quote`,
      {
        method: "POST",
        body,
      },
    ),
  );
}

export async function payOperationBatch(
  body: Record<string, unknown>,
): Promise<PayablePayQuote> {
  return mapPayablePayResponse(
    await http<unknown>(`${PAY_API_PREFIX}/operations/pay/quote`, {
      method: "POST",
      body,
    }),
  );
}

export function payablePayBody(request: PayablePayRequest): Record<string, unknown> {
  const { organization_id, payer, source_network, source_symbol, notification, adjustments } =
    request;
  const body: Record<string, unknown> = {
    organization_id,
    payer,
    source_network,
    source_symbol,
  };
  if (notification) body.notification = notification;
  if (request.type === PAYABLE_TYPE.Payroll && "period_month" in request) {
    if (adjustments?.length) body.adjustments = adjustments;
    body.period_month = request.period_month;
    body.timezone = request.timezone;
    return body;
  }
  if (isOperationPayableType(request.type) && "batchId" in request) {
    body.batch_id = request.batchId;
    body.category = request.type;
    return body;
  }
  return body;
}

export async function payPayable(request: PayablePayRequest): Promise<PayablePayQuote> {
  if (request.type === PAYABLE_TYPE.Payroll && "period_month" in request) {
    const { type: _type, ...body } = request;
    return payPayrollSalaries(body);
  }
  if (!("batchId" in request)) {
    return payOperationBatch(payablePayBody(request));
  }
  const { type, batchId, adjustments: _adjustments, ...body } = request;
  if (type === PAYABLE_TYPE.Expense) {
    return payExpenseBatch(batchId, body);
  }
  if (type === PAYABLE_TYPE.Bonus) {
    return payBonusBatch(batchId, body);
  }
  return payOperationBatch(payablePayBody(request));
}

