import { AUTH_USER_ROLE, type AuthUser, type AuthUserRole } from "@/types/auth";

export function userRole(user: AuthUser | null | undefined): AuthUserRole {
  return user?.role === AUTH_USER_ROLE.Employee
    ? AUTH_USER_ROLE.Employee
    : AUTH_USER_ROLE.Admin;
}

export function isEmployee(user: AuthUser | null | undefined): boolean {
  return userRole(user) === AUTH_USER_ROLE.Employee;
}
