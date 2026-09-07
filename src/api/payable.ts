import { PAY_API_PREFIX } from "@/api/config";
import { apiNumber, apiText, asRecord } from "@/api/map";
import { isPayrollBatchBroadcastable, mapPayrollBatch } from "@/api/payout";
import { ApiError } from "@/lib/api-error";
import { http } from "@/lib/http";
import {
  PAYABLE_TYPE,
  type Payable,
  type PayableItem,
  type PayablePayBaseParam,
  type PayablePayRequest,
  type PayableType,
  type PayrollPayParam,
} from "@/types/payable";
import type { PayrollBatch } from "@/types/payout";

const PAYABLE_TYPES = new Set<string>(Object.values(PAYABLE_TYPE));

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
  if (batchId == null) return null;
  return { type, batchId };
}

export function mapPayable(raw: unknown): Payable | null {
  const row = asRecord(raw);
  if (!row) return null;
  const type = apiText(row.type).trim();
  if (!PAYABLE_TYPES.has(type)) return null;
  const payableType = type as PayableType;
  const periodMonth = apiText(row.period_month ?? row.periodMonth).trim();
  const batchId = apiNumber(row.batch_id ?? row.batchId);
  const key = payableKeyFromRow(payableType, periodMonth, batchId);
  if (!key) return null;
  const items = Array.isArray(row.list)
    ? row.list.flatMap((item) => {
        const mapped = mapPayableItem(item);
        return mapped ? [mapped] : [];
      })
    : [];
  return {
    key,
    type: payableType,
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

function mapPayablePayResponse(raw: unknown): PayrollBatch {
  const row = asRecord(raw) ?? {};
  const batch = mapPayrollBatch(row.batch ?? raw);
  if (!isPayrollBatchBroadcastable(batch)) {
    throw new ApiError("Batch transaction is missing from the response", 502, "NO_BATCH_TX");
  }
  return batch;
}

export async function payPayrollSalaries(body: PayrollPayParam): Promise<PayrollBatch> {
  return mapPayablePayResponse(
    await http<unknown>(`${PAY_API_PREFIX}/salaries/pay`, { method: "POST", body }),
  );
}

export async function payExpenseBatch(
  batchId: number,
  body: PayablePayBaseParam,
): Promise<PayrollBatch> {
  return mapPayablePayResponse(
    await http<unknown>(`${PAY_API_PREFIX}/expenses/${encodeURIComponent(String(batchId))}/pay`, {
      method: "POST",
      body,
    }),
  );
}

export async function payBonusBatch(
  batchId: number,
  body: PayablePayBaseParam,
): Promise<PayrollBatch> {
  return mapPayablePayResponse(
    await http<unknown>(`${PAY_API_PREFIX}/bonuses/${encodeURIComponent(String(batchId))}/pay`, {
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
  if (notification?.length) body.notification = notification;
  if (adjustments?.length) body.adjustments = adjustments;
  if (request.type === PAYABLE_TYPE.Payroll) {
    body.period_month = request.period_month;
    body.timezone = request.timezone;
  }
  return body;
}

export async function payPayable(request: PayablePayRequest): Promise<PayrollBatch> {
  if (request.type === PAYABLE_TYPE.Payroll) {
    const { type: _type, ...body } = request;
    return payPayrollSalaries(body);
  }
  const { type, batchId, ...body } = request;
  if (type === PAYABLE_TYPE.Expense) {
    return payExpenseBatch(batchId, body);
  }
  return payBonusBatch(batchId, body);
}

