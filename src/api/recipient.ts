import { http } from "@/lib/http";
import { PAY_API_PREFIX } from "@/api/config";
import { apiNumber, apiText, asRecord } from "@/api/map";
import type { PayRecipient, PayRecipientBody } from "@/types/recipient";

export function mapRecipient(raw: unknown): PayRecipient {
  const row = asRecord(raw) ?? {};
  const id = apiNumber(row.id);
  const email = apiText(row.email).trim();
  return {
    id: id === null ? apiText(row.id) : String(id),
    name: apiText(row.name),
    wallet: apiText(row.address ?? row.wallet).trim(),
    email: email || null,
  };
}

function recipientWriteBody(body: PayRecipientBody) {
  const email = body.email?.trim();
  return {
    name: body.name,
    address: body.wallet,
    ...(email ? { email } : {}),
  };
}

export async function listRecipients(): Promise<PayRecipient[]> {
  const data = await http<unknown>(`${PAY_API_PREFIX}/recipients`);
  if (!Array.isArray(data)) return [];
  return data.map(mapRecipient);
}

export async function createRecipient(body: PayRecipientBody) {
  return mapRecipient(
    await http<unknown>(`${PAY_API_PREFIX}/recipients`, {
      method: "POST",
      body: recipientWriteBody(body),
    }),
  );
}

export async function updateRecipient(id: string, body: PayRecipientBody) {
  return mapRecipient(
    await http<unknown>(`${PAY_API_PREFIX}/recipients/${id}`, {
      method: "POST",
      body: recipientWriteBody(body),
    }),
  );
}

export function deleteRecipient(id: string) {
  return http<void>(`${PAY_API_PREFIX}/recipients/${id}`, { method: "DELETE" });
}
