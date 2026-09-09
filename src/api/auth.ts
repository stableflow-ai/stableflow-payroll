import { PAY_API_PREFIX } from "@/api/config";
import { apiNumber, apiText, asRecord } from "@/api/map";
import { ApiError } from "@/lib/api-error";
import { http } from "@/lib/http";
import {
  AUTH_USER_ROLE,
  type AuthOrganization,
  type AuthSession,
  type AuthTeamMember,
  type AuthUser,
  type ChangePasswordBody,
  type LoginBody,
  type RegisterBody,
  type RegisterUserBody,
  type ResetPasswordBody,
  type ResetPasswordCodeBody,
  type UpdateMemberProfileBody,
  type UpdateProfileBody,
} from "@/types/auth";

function mapAuthOrganization(value: unknown): AuthOrganization | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const row = asRecord(value);
  if (!row) return undefined;
  const name = apiText(row.name).trim();
  if (!name) return null;
  const id = apiNumber(row.id) ?? 0;
  const logo = apiText(row.logo).trim();
  const orgId = apiText(row.org_id ?? row.orgId).trim();
  return {
    id,
    name,
    ...(logo ? { logo } : {}),
    ...(orgId ? { orgId } : {}),
  };
}

function optionalHandle(value: unknown): string | undefined {
  const text = apiText(value).trim();
  return text || undefined;
}

function mapAuthTeamMember(value: unknown): AuthTeamMember | undefined {
  const row = asRecord(value);
  if (!row) return undefined;
  return {
    name: apiText(row.name).trim(),
    position: apiText(row.position).trim(),
    email: apiText(row.email).trim(),
    telegram: apiText(row.telegram_chat_id ?? row.telegramChatId).trim(),
    slack: apiText(row.slack_user_id ?? row.slackUserId).trim(),
    wallets: {
      evm: apiText(row.evm_address ?? row.evmAddress).trim(),
      solana: apiText(row.solana_address ?? row.solanaAddress).trim(),
      near: apiText(row.near_address ?? row.nearAddress).trim(),
      tron: apiText(row.tron_address ?? row.tronAddress).trim(),
    },
  };
}

export function mapAuthUser(raw: unknown): AuthUser {
  const row = asRecord(raw) ?? {};
  const id = apiNumber(row.id);
  if (id === null) {
    throw new ApiError("Invalid user", 502, "INVALID_USER");
  }
  const telegram = optionalHandle(row.telegram);
  const slack = optionalHandle(row.slack);
  const teamMember = mapAuthTeamMember(row.team_member ?? row.teamMember);
  return {
    id,
    email: apiText(row.email),
    name: apiText(row.name),
    role: apiText(row.role) === AUTH_USER_ROLE.User ? AUTH_USER_ROLE.User : AUTH_USER_ROLE.Admin,
    ...(telegram ? { telegram } : {}),
    ...(slack ? { slack } : {}),
    ...(teamMember ? { teamMember } : {}),
    organization: mapAuthOrganization(row.organization),
  };
}

export function mapAuthSession(raw: unknown): AuthSession {
  const row = asRecord(raw) ?? {};
  const token = apiText(row.token);
  if (!token) {
    throw new ApiError("Missing session token", 502, "INVALID_SESSION");
  }
  return {
    token,
    user: mapAuthUser(row.user),
  };
}

export async function login(body: LoginBody) {
  return mapAuthSession(
    await http<unknown>(`${PAY_API_PREFIX}/auth/login`, {
      method: "POST",
      body,
      auth: false,
    }),
  );
}

export async function register(body: RegisterBody) {
  return mapAuthSession(
    await http<unknown>(`${PAY_API_PREFIX}/auth/register`, {
      method: "POST",
      body,
      auth: false,
    }),
  );
}

function omitEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export function registerUserBody(body: RegisterUserBody): Record<string, string> {
  const payload: Record<string, string> = {
    org_id: body.orgId,
    email: body.email,
    password: body.password,
    name: body.name,
  };
  const optional: Array<[string, string | undefined]> = [
    ["position", omitEmpty(body.position)],
    ["evm_address", omitEmpty(body.evmAddress)],
    ["solana_address", omitEmpty(body.solanaAddress)],
    ["near_address", omitEmpty(body.nearAddress)],
    ["tron_address", omitEmpty(body.tronAddress)],
    ["telegram", omitEmpty(body.telegram)],
    ["slack", omitEmpty(body.slack)],
  ];
  for (const [key, value] of optional) {
    if (value) payload[key] = value;
  }
  return payload;
}

export async function registerUser(body: RegisterUserBody) {
  return mapAuthSession(
    await http<unknown>(`${PAY_API_PREFIX}/auth/register/user`, {
      method: "POST",
      body: registerUserBody(body),
      auth: false,
    }),
  );
}

export function changePassword(body: ChangePasswordBody) {
  return http<void>(`${PAY_API_PREFIX}/change-password`, {
    method: "POST",
    body,
  });
}

export function sendResetPasswordCode(body: ResetPasswordCodeBody) {
  return http<void>(`${PAY_API_PREFIX}/reset-password/code`, {
    method: "POST",
    body,
    auth: false,
  });
}

export function resetPassword(body: ResetPasswordBody) {
  return http<void>(`${PAY_API_PREFIX}/reset-password`, {
    method: "POST",
    body,
    auth: false,
  });
}

export async function getProfile() {
  return mapAuthUser(await http<unknown>(`${PAY_API_PREFIX}/profile`));
}

export function updateProfile(body: UpdateProfileBody) {
  return http<void>(`${PAY_API_PREFIX}/profile`, {
    method: "POST",
    body,
  });
}

export function updateMemberProfileBody(body: UpdateMemberProfileBody) {
  const wallets = body.wallets;
  const teamMember: Record<string, string> = {};
  const optional: Array<[string, string | undefined]> = [
    ["position", omitEmpty(body.position)],
    ["evm_address", omitEmpty(wallets.evm)],
    ["solana_address", omitEmpty(wallets.solana)],
    ["near_address", omitEmpty(wallets.near)],
    ["tron_address", omitEmpty(wallets.tron)],
    ["telegram_chat_id", omitEmpty(body.telegram)],
    ["slack_user_id", omitEmpty(body.slack)],
  ];
  for (const [key, value] of optional) {
    if (value) teamMember[key] = value;
  }
  return {
    name: body.name.trim(),
    organization_id: body.organizationId,
    ...(Object.keys(teamMember).length > 0 ? { team_member: teamMember } : {}),
  };
}

export function updateMemberProfile(body: UpdateMemberProfileBody) {
  return http<void>(`${PAY_API_PREFIX}/profile/user`, {
    method: "POST",
    body: updateMemberProfileBody(body),
  });
}
