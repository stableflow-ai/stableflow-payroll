import { describe, expect, it } from "vitest";
import { AUTH_USER_ROLE, type AuthUser } from "@/types/auth";
import { hasOrganization, isEmployee, organizationName, userRole } from "./auth-role";

function user(role: AuthUser["role"], organization?: AuthUser["organization"]): AuthUser {
  return {
    id: 1,
    email: "a@b.c",
    name: "Ada",
    role,
    organization,
  };
}

describe("userRole", () => {
  it("returns employee when the user is an employee", () => {
    expect(userRole(user(AUTH_USER_ROLE.Employee))).toBe(AUTH_USER_ROLE.Employee);
    expect(isEmployee(user(AUTH_USER_ROLE.Employee))).toBe(true);
  });

  it("treats missing or admin role as admin", () => {
    expect(userRole(user(AUTH_USER_ROLE.Admin))).toBe(AUTH_USER_ROLE.Admin);
    expect(userRole(null)).toBe(AUTH_USER_ROLE.Admin);
    expect(userRole(undefined)).toBe(AUTH_USER_ROLE.Admin);
    expect(isEmployee(user(AUTH_USER_ROLE.Admin))).toBe(false);
    expect(isEmployee({ id: 1, email: "a@b.c", name: "Ada" } as AuthUser)).toBe(false);
  });
});

describe("hasOrganization", () => {
  it("is true only when organization.name is non-empty", () => {
    expect(hasOrganization(user(AUTH_USER_ROLE.Admin))).toBe(false);
    expect(hasOrganization(user(AUTH_USER_ROLE.Admin, null))).toBe(false);
    expect(hasOrganization(user(AUTH_USER_ROLE.Admin, { name: "   " }))).toBe(false);
    expect(hasOrganization(user(AUTH_USER_ROLE.Admin, { name: "Eureka Labs" }))).toBe(true);
    expect(organizationName(user(AUTH_USER_ROLE.Admin, { name: " Eureka Labs " }))).toBe(
      "Eureka Labs",
    );
  });
});
