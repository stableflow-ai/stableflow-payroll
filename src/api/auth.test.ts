import { describe, expect, it } from "vitest";
import { mapAuthSession, mapAuthUser, registerUserBody, updateMemberProfileBody } from "./auth";
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
        telegram: "@ada",
        slack: "ada",
        organization: {
          id: 9,
          name: "Eureka Labs",
          logo: "https://cdn.example/logo.png",
          org_id: "org_abc",
        },
      }),
    ).toEqual({
      id: 3,
      email: "ada@example.com",
      name: "Ada",
      role: AUTH_USER_ROLE.User,
      telegram: "@ada",
      slack: "ada",
      organization: {
        id: 9,
        name: "Eureka Labs",
        logo: "https://cdn.example/logo.png",
        orgId: "org_abc",
      },
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

  it("maps team_member wallets and slack_user_id", () => {
    expect(
      mapAuthUser({
        id: 4,
        email: "ada@example.com",
        name: "Ada",
        role: "user",
        organization: { id: 1, name: "Eureka Labs" },
        team_member: {
          name: "Ada",
          position: "Engineer",
          email: "ada@example.com",
          evm_address: "0xabc",
          solana_address: "",
          near_address: "ada.near",
          tron_address: "",
          slack_user_id: "ada",
        },
      }),
    ).toEqual({
      id: 4,
      email: "ada@example.com",
      name: "Ada",
      role: AUTH_USER_ROLE.User,
      teamMember: {
        name: "Ada",
        position: "Engineer",
        email: "ada@example.com",
        telegram: "",
        slack: "ada",
        wallets: { evm: "0xabc", solana: "", near: "ada.near", tron: "" },
      },
      organization: { id: 1, name: "Eureka Labs" },
    });
  });

  it("omits teamMember when the profile has no team_member object", () => {
    expect(
      mapAuthUser({
        id: 1,
        email: "a@b.c",
        name: "Ada",
        role: "user",
      }).teamMember,
    ).toBeUndefined();
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

describe("registerUserBody", () => {
  it("omits empty optional fields", () => {
    expect(
      registerUserBody({
        orgId: "org_abc",
        email: "ada@example.com",
        password: "secret123",
        name: "Ada",
        position: "  ",
        evmAddress: "0xabc",
        solanaAddress: "",
        telegram: "@ada",
        slack: "  ",
      }),
    ).toEqual({
      org_id: "org_abc",
      email: "ada@example.com",
      password: "secret123",
      name: "Ada",
      evm_address: "0xabc",
      telegram: "@ada",
    });
  });
});

describe("updateMemberProfileBody", () => {
  it("omits empty team_member fields and uses wire keys", () => {
    expect(
      updateMemberProfileBody({
        name: " Ada ",
        organizationId: 1,
        position: "  ",
        telegram: "",
        slack: "ada",
        wallets: { evm: "0xabc", solana: "", near: "", tron: "" },
      }),
    ).toEqual({
      name: "Ada",
      organization_id: 1,
      team_member: {
        evm_address: "0xabc",
        slack_user_id: "ada",
      },
    });
  });

  it("includes position and telegram_chat_id when filled", () => {
    expect(
      updateMemberProfileBody({
        name: "Ada",
        organizationId: 1,
        position: "Engineer",
        telegram: "@ada",
        slack: "",
        wallets: { evm: "", solana: "", near: "", tron: "" },
      }),
    ).toEqual({
      name: "Ada",
      organization_id: 1,
      team_member: {
        position: "Engineer",
        telegram_chat_id: "@ada",
      },
    });
  });
});
