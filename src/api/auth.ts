import { PAY_API_PREFIX } from "@/api/config";
import { apiNumber, apiText, asRecord } from "@/api/map";
import { ApiError } from "@/lib/api-error";
import { http } from "@/lib/http";
import {
  AUTH_USER_ROLE,
  type AuthOrganization,
  type AuthSession,
  type AuthUser,
  type ChangePasswordBody,
  type LoginBody,
  type RegisterBody,
  type ResetPasswordBody,
  type ResetPasswordCodeBody,
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
  return logo ? { id, name, logo } : { id, name };
}

export function mapAuthUser(raw: unknown): AuthUser {
  const row = asRecord(raw) ?? {};
  const id = apiNumber(row.id);
  if (id === null) {
    throw new ApiError("Invalid user", 502, "INVALID_USER");
  }
  return {
    id,
    email: apiText(row.email),
    name: apiText(row.name),
    role: apiText(row.role) === AUTH_USER_ROLE.User ? AUTH_USER_ROLE.User : AUTH_USER_ROLE.Admin,
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
