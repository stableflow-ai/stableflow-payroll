import { PAY_API_PREFIX } from "@/api/config";
import { http } from "@/lib/http";
import type { AuthSession, LoginBody, RegisterBody } from "@/types/auth";

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
