import { http } from "@/lib/http";
import { PAY_API_PREFIX } from "@/api/config";
import { apiText, asRecord } from "@/api/map";
import type { PayRecipient, PayRecipientBody } from "@/types/recipient";

function mapRecipient(raw: unknown): PayRecipient {
  const row = asRecord(raw) ?? {};
  const email = apiText(row.email);
  return {
    id: apiText(row.id),
    name: apiText(row.name),
    address: apiText(row.address),
    email: email || null,
  };
}

export async function listRecipients(): Promise<PayRecipient[]> {
  const data = await http<unknown>(`${PAY_API_PREFIX}/recipient/list`);
  const list = Array.isArray(data)
    ? data
    : Array.isArray(asRecord(data)?.list)
      ? (asRecord(data)?.list as unknown[])
      : [];
  return list.map(mapRecipient);
}

export async function createRecipient(body: PayRecipientBody) {
  return mapRecipient(await http<unknown>(`${PAY_API_PREFIX}/recipient`, { method: "POST", body }));
}

export async function updateRecipient(id: string, body: PayRecipientBody) {
  return mapRecipient(await http<unknown>(`${PAY_API_PREFIX}/recipient/${id}`, { method: "POST", body }));
}

export function deleteRecipient(id: string) {
  return http<void>(`${PAY_API_PREFIX}/recipient/${id}`, { method: "DELETE" });
}
