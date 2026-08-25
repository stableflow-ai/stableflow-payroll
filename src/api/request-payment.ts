import { http } from "@/lib/http";
import { PAY_API_PREFIX } from "@/api/config";
import { apiNumber, apiText, asRecord } from "@/api/map";
import { ApiError } from "@/lib/api-error";
import type {
  PayCreateRequestParam,
  PayCreateRequestResp,
  PayRequestItem,
  PayWithdrawParam,
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
    memo: apiText(row.memo),
    created_at: apiText(row.created_at ?? row.createdAt),
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

export function createPayRequest(body: PayCreateRequestParam) {
  return http<unknown>(`${PAY_API_PREFIX}/request`, { method: "POST", body }).then(mapCreateResp);
}

export function getPayRequest(id: number) {
  return http<unknown>(`${PAY_API_PREFIX}/request/${id}`).then(mapPayRequestItem);
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
