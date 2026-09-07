import { AUTH_USER_ROLE, type AuthUser, type AuthUserRole } from "@/types/auth";

export function userRole(user: AuthUser | null | undefined): AuthUserRole {
  return user?.role === AUTH_USER_ROLE.User ? AUTH_USER_ROLE.User : AUTH_USER_ROLE.Admin;
}

export function isUser(user: AuthUser | null | undefined): boolean {
  return userRole(user) === AUTH_USER_ROLE.User;
}

export function organizationName(user: AuthUser | null | undefined): string | null {
  const name = user?.organization?.name?.trim();
  return name || null;
}

export function hasOrganization(user: AuthUser | null | undefined): boolean {
  return Boolean(organizationName(user));
}
