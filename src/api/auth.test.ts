import { describe, expect, it } from "vitest";
import { mapAuthSession, mapAuthUser } from "./auth";
import { AUTH_USER_ROLE } from "@/types/auth";
import { ApiError } from "@/lib/api-error";

describe("mapAuthUser", () => {
  it("maps user role and organization fields", () => {
    expect(
      mapAuthUser({
        id: 3,
        email: "ada@example.com",
        name: "Ada",
        role: "user",
        organization: { id: 9, name: "Eureka Labs", logo: "https://cdn.example/logo.png" },
      }),
    ).toEqual({
      id: 3,
      email: "ada@example.com",
      name: "Ada",
      role: AUTH_USER_ROLE.User,
      organization: { id: 9, name: "Eureka Labs", logo: "https://cdn.example/logo.png" },
    });
  });

  it("treats unknown roles as admin and blank organization names as missing", () => {
    expect(
      mapAuthUser({
        id: 1,
        email: "a@b.c",
        name: "Ada",
        role: "employee",
        organization: { id: 2, name: "  " },
      }),
    ).toEqual({
      id: 1,
      email: "a@b.c",
      name: "Ada",
      role: AUTH_USER_ROLE.Admin,
      organization: null,
    });
  });

  it("throws when id is missing", () => {
    expect(() => mapAuthUser({ email: "a@b.c", name: "Ada" })).toThrow(ApiError);
  });
});

describe("mapAuthSession", () => {
  it("maps token and user", () => {
    expect(
      mapAuthSession({
        token: "jwt",
        user: { id: 1, email: "a@b.c", name: "Ada", role: "admin" },
      }),
    ).toEqual({
      token: "jwt",
      user: {
        id: 1,
        email: "a@b.c",
        name: "Ada",
        role: AUTH_USER_ROLE.Admin,
        organization: undefined,
      },
    });
  });

  it("throws when token is missing", () => {
    expect(() => mapAuthSession({ user: { id: 1, email: "a@b.c", name: "Ada" } })).toThrow(ApiError);
  });
});
