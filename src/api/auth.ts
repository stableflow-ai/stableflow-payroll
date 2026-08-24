import { PAY_API_PREFIX } from "@/api/config";
import { http } from "@/lib/http";
import type {
  AuthSession,
  AuthUser,
  ChangePasswordBody,
  LoginBody,
  RegisterBody,
  ResetPasswordBody,
  ResetPasswordCodeBody,
} from "@/types/auth";

export function login(body: LoginBody) {
  return http<AuthSession>(`${PAY_API_PREFIX}/auth/login`, {
    method: "POST",
    body,
    auth: false,
  });
}

export function register(body: RegisterBody) {
  return http<AuthSession>(`${PAY_API_PREFIX}/auth/register`, {
    method: "POST",
    body,
    auth: false,
  });
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

export function getProfile() {
  return http<AuthUser>(`${PAY_API_PREFIX}/profile`);
}
