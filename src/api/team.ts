import { PAY_API_PREFIX } from "@/api/config";
import { apiNumber, apiText, asRecord } from "@/api/map";
import { http } from "@/lib/http";
import type {
  TeamMember,
  TeamMemberWallets,
  TeamMemberWrite,
  TeamMembersPage,
  TeamMembersQuery,
} from "@/types/team";

function emptyWallets(): TeamMemberWallets {
  return { evm: "", solana: "", near: "", tron: "" };
}

export function mapTeamMember(raw: unknown): TeamMember | null {
  const row = asRecord(raw);
  if (!row) return null;
  const id = apiNumber(row.id);
  const name = apiText(row.name).trim();
  if (id === null || !name) return null;
  return {
    id,
    name,
    position: apiText(row.position).trim(),
    email: apiText(row.email).trim(),
    wallets: {
      evm: apiText(row.evm_address ?? row.evmAddress).trim(),
      solana: apiText(row.solana_address ?? row.solanaAddress).trim(),
      near: apiText(row.near_address ?? row.nearAddress).trim(),
      tron: apiText(row.tron_address ?? row.tronAddress).trim(),
    },
  };
}

export function mapTeamMembersPage(raw: unknown): TeamMembersPage {
  const row = asRecord(raw) ?? {};
  const source = Array.isArray(row.list) ? row.list : [];
  return {
    list: source.flatMap((item) => {
      const member = mapTeamMember(item);
      return member ? [member] : [];
    }),
    total: apiNumber(row.total) ?? 0,
    totalPage: apiNumber(row.total_page ?? row.totalPage) ?? 0,
  };
}

function omitEmpty(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function teamMemberWriteBody(body: TeamMemberWrite) {
  const wallets = body.wallets ?? emptyWallets();
  return {
    name: body.name.trim(),
    ...(omitEmpty(body.position) ? { position: body.position.trim() } : {}),
    ...(omitEmpty(body.email) ? { email: body.email.trim() } : {}),
    ...(omitEmpty(wallets.evm) ? { evm_address: wallets.evm.trim() } : {}),
    ...(omitEmpty(wallets.solana) ? { solana_address: wallets.solana.trim() } : {}),
    ...(omitEmpty(wallets.near) ? { near_address: wallets.near.trim() } : {}),
    ...(omitEmpty(wallets.tron) ? { tron_address: wallets.tron.trim() } : {}),
  };
}

export async function getTeamMembers(params: TeamMembersQuery) {
  const q = params.q?.trim();
  return mapTeamMembersPage(
    await http<unknown>(`${PAY_API_PREFIX}/team/members`, {
      query: {
        organization_id: params.organizationId,
        page: params.page,
        pageSize: params.pageSize,
        ...(q ? { q } : {}),
      },
    }),
  );
}

export async function createTeamMember(organizationId: number, body: TeamMemberWrite) {
  const mapped = mapTeamMember(
    await http<unknown>(`${PAY_API_PREFIX}/team/members`, {
      method: "POST",
      body: { ...teamMemberWriteBody(body), organization_id: organizationId },
    }),
  );
  if (!mapped) {
    throw new Error("Invalid team member");
  }
  return mapped;
}

export async function updateTeamMember(id: number, body: TeamMemberWrite) {
  const mapped = mapTeamMember(
    await http<unknown>(`${PAY_API_PREFIX}/team/members/${id}`, {
      method: "POST",
      body: teamMemberWriteBody(body),
    }),
  );
  if (!mapped) {
    throw new Error("Invalid team member");
  }
  return mapped;
}

export async function deleteTeamMember(id: number) {
  await http<void>(`${PAY_API_PREFIX}/team/members/${id}`, { method: "DELETE" });
}
