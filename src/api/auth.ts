import { PAY_API_PREFIX } from "@/api/config";
import { http } from "@/lib/http";
import { hydrateAuthUser } from "@/lib/auth-session";
import type {
  AuthSession,
  AuthUser,
  ChangePasswordBody,
  LoginBody,
  RegisterBody,
  ResetPasswordBody,
  ResetPasswordCodeBody,
  UpdateProfileBody,
} from "@/types/auth";

function mapAuthSession(session: AuthSession): AuthSession {
  return { token: session.token, user: hydrateAuthUser(session.user) };
}

export async function login(body: LoginBody) {
  return mapAuthSession(
    await http<AuthSession>(`${PAY_API_PREFIX}/auth/login`, {
      method: "POST",
      body,
      auth: false,
    }),
  );
}

export async function register(body: RegisterBody) {
  return mapAuthSession(
    await http<AuthSession>(`${PAY_API_PREFIX}/auth/register`, {
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
  const user = await http<AuthUser>(`${PAY_API_PREFIX}/profile`);
  return hydrateAuthUser(user);
}

export function updateProfile(body: UpdateProfileBody) {
  return http<void>(`${PAY_API_PREFIX}/profile`, {
    method: "POST",
    body,
  });
}
