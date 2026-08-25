import { http } from "@/lib/http";
import { PAY_API_PREFIX } from "@/api/config";
import { apiNumber, apiText, asRecord } from "@/api/map";
import { ApiError } from "@/lib/api-error";
import type {
  PayCreatePartnerBody,
  PayCreatePartnerResp,
  PayPartner,
  PayPartnerKey,
  PayPartnerKeyLabelBody,
} from "@/types/partner";

function mapPartner(raw: unknown): PayPartner | null {
  const row = asRecord(raw);
  if (!row) return null;
  const id = apiNumber(row.id);
  if (id == null || id <= 0) return null;
  return {
    id,
    userId: apiNumber(row.user_id ?? row.userId) ?? 0,
    firstName: apiText(row.first_name ?? row.firstName),
    lastName: apiText(row.last_name ?? row.lastName),
    company: apiText(row.company),
    purpose: apiText(row.purpose),
    website: apiText(row.website),
    telegram: apiText(row.telegram),
    description: apiText(row.description),
    createdAt: apiText(row.created_at ?? row.createdAt),
  };
}

function mapPartnerKey(raw: unknown): PayPartnerKey {
  const row = asRecord(raw) ?? {};
  return {
    id: apiNumber(row.id) ?? 0,
    userId: apiNumber(row.user_id ?? row.userId) ?? 0,
    label: apiText(row.label),
    apiKey: apiText(row.api_key ?? row.apiKey),
    createdAt: apiText(row.created_at ?? row.createdAt),
    status: apiNumber(row.status) ?? 0,
  };
}

function mapPartnerKeyList(data: unknown): PayPartnerKey[] {
  const list = Array.isArray(data)
    ? data
    : Array.isArray(asRecord(data)?.list)
      ? (asRecord(data)?.list as unknown[])
      : [];
  return list.map(mapPartnerKey).filter((row) => row.id > 0);
}

export async function getPartner(): Promise<PayPartner | null> {
  return mapPartner(await http<unknown>(`${PAY_API_PREFIX}/partner`));
}

export async function createPartner(body: PayCreatePartnerBody): Promise<PayCreatePartnerResp> {
  const data = asRecord(await http<unknown>(`${PAY_API_PREFIX}/partner`, { method: "POST", body })) ?? {};
  const id = apiNumber(data.id);
  if (id == null || id <= 0) {
    throw new ApiError("Create partner did not return an id", 400, "PAY_PARTNER");
  }
  return { id };
}

export async function listPartnerKeys(): Promise<PayPartnerKey[]> {
  return mapPartnerKeyList(await http<unknown>(`${PAY_API_PREFIX}/partner/keys`));
}

export async function createPartnerKey(body: PayPartnerKeyLabelBody): Promise<PayPartnerKey> {
  const key = mapPartnerKey(
    await http<unknown>(`${PAY_API_PREFIX}/partner/keys`, { method: "POST", body }),
  );
  if (key.id <= 0) {
    throw new ApiError("Create API key did not return an id", 400, "PAY_PARTNER_KEY");
  }
  return key;
}

export function updatePartnerKeyLabel(id: number, body: PayPartnerKeyLabelBody) {
  return http<void>(`${PAY_API_PREFIX}/partner/keys/${id}`, { method: "POST", body });
}

export function deletePartnerKey(id: number) {
  return http<void>(`${PAY_API_PREFIX}/partner/keys/${id}`, { method: "DELETE" });
}
