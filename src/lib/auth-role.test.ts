import { describe, expect, it } from "vitest";
import { AUTH_USER_ROLE, type AuthUser } from "@/types/auth";
import { hasOrganization, isUser, organizationLogo, organizationName, userRole } from "./auth-role";

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
  it("returns user when the role is user", () => {
    expect(userRole(user(AUTH_USER_ROLE.User))).toBe(AUTH_USER_ROLE.User);
    expect(isUser(user(AUTH_USER_ROLE.User))).toBe(true);
  });

  it("treats missing or admin role as admin", () => {
    expect(userRole(user(AUTH_USER_ROLE.Admin))).toBe(AUTH_USER_ROLE.Admin);
    expect(userRole(null)).toBe(AUTH_USER_ROLE.Admin);
    expect(userRole(undefined)).toBe(AUTH_USER_ROLE.Admin);
    expect(isUser(user(AUTH_USER_ROLE.Admin))).toBe(false);
    expect(isUser({ id: 1, email: "a@b.c", name: "Ada" } as AuthUser)).toBe(false);
  });
});

describe("hasOrganization", () => {
  it("is true only when organization.name is non-empty", () => {
    expect(hasOrganization(user(AUTH_USER_ROLE.Admin))).toBe(false);
    expect(hasOrganization(user(AUTH_USER_ROLE.Admin, null))).toBe(false);
    expect(hasOrganization(user(AUTH_USER_ROLE.Admin, { id: 1, name: "   " }))).toBe(false);
    expect(hasOrganization(user(AUTH_USER_ROLE.Admin, { id: 1, name: "Eureka Labs" }))).toBe(true);
    expect(organizationName(user(AUTH_USER_ROLE.Admin, { id: 1, name: " Eureka Labs " }))).toBe(
      "Eureka Labs",
    );
  });

  it("returns a trimmed logo URL when present", () => {
    expect(organizationLogo(user(AUTH_USER_ROLE.Admin))).toBeNull();
    expect(organizationLogo(user(AUTH_USER_ROLE.Admin, { id: 1, name: "Eureka Labs" }))).toBeNull();
    expect(
      organizationLogo(
        user(AUTH_USER_ROLE.Admin, {
          id: 1,
          name: "Eureka Labs",
          logo: " https://cdn.example/logo.png ",
        }),
      ),
    ).toBe("https://cdn.example/logo.png");
  });
});
