import { describe, expect, it } from "vitest";
import { AUTH_USER_ROLE, type AuthUser } from "@/types/auth";
import {
  loginPathWithReturnTo,
  postAuthPath,
  registerPathWithReturnTo,
  returnToFromSearch,
  safeReturnTo,
} from "./return-to";

describe("safeReturnTo", () => {
  it("accepts in-app relative paths including search", () => {
    expect(safeReturnTo("/pay?addr=0x1&amount=1")).toBe("/pay?addr=0x1&amount=1");
    expect(safeReturnTo(encodeURIComponent("/pay?addr=0x1"))).toBe("/pay?addr=0x1");
  });

  it("rejects open redirects and auth routes", () => {
    expect(safeReturnTo("https://evil.test/pay")).toBeNull();
    expect(safeReturnTo("//evil.test")).toBeNull();
    expect(safeReturnTo("/login")).toBeNull();
    expect(safeReturnTo("/register?x=1")).toBeNull();
    expect(safeReturnTo("/register/organization")).toBeNull();
    expect(safeReturnTo("/invite/abc")).toBeNull();
    expect(safeReturnTo("")).toBeNull();
  });
});

describe("auth links", () => {
  it("encodes returnTo on login and register paths", () => {
    expect(loginPathWithReturnTo("/pay?a=1")).toBe("/login?returnTo=%2Fpay%3Fa%3D1");
    expect(registerPathWithReturnTo("/pay?a=1")).toBe("/register?returnTo=%2Fpay%3Fa%3D1");
    expect(loginPathWithReturnTo(null)).toBe("/login");
  });

  it("reads returnTo from a search string", () => {
    expect(returnToFromSearch("returnTo=%2Fpay%3Faddr%3D1")).toBe("/pay?addr=1");
  });
});

describe("postAuthPath", () => {
  const admin: AuthUser = {
    id: 1,
    email: "admin@example.com",
    name: "Ada",
    role: AUTH_USER_ROLE.Admin,
  };
  const member: AuthUser = {
    id: 2,
    email: "user@example.com",
    name: "Eve",
    role: AUTH_USER_ROLE.User,
  };

  it("returns returnTo or home for any signed-in user", () => {
    expect(postAuthPath(admin, "/pay")).toBe("/pay");
    expect(postAuthPath({ ...admin, organization: null }, "/")).toBe("/");
    expect(postAuthPath(admin, null)).toBe("/");
    expect(postAuthPath(member, "/pay")).toBe("/pay");
    expect(postAuthPath(member, null)).toBe("/");
  });
});
