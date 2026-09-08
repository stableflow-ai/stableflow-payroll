import { describe, expect, it } from "vitest";
import { AUTH_USER_ROLE, type AuthUser } from "@/types/auth";
import { mergeProfileUser } from "./use-auth-api";

function user(organization?: AuthUser["organization"]): AuthUser {
  return {
    id: 1,
    email: "a@b.c",
    name: "Ada",
    role: AUTH_USER_ROLE.Admin,
    organization,
  };
}

describe("mergeProfileUser", () => {
  it("keeps a locally saved logo when the profile still has the old url", () => {
    const profile = user({
      id: 9,
      name: "Eureka Labs",
      logo: "https://cdn.example/old.png",
      orgId: "e",
    });
    const local = user({
      id: 9,
      name: "Eureka Labs",
      logo: "https://cdn.example/new.png",
      orgId: "e",
    });
    expect(mergeProfileUser(profile, local).organization?.logo).toBe(
      "https://cdn.example/new.png",
    );
  });

  it("uses the profile logo when the session has none", () => {
    const profile = user({
      id: 9,
      name: "Eureka Labs",
      logo: "https://cdn.example/logo.png",
      orgId: "e",
    });
    const local = user({ id: 9, name: "Eureka Labs", orgId: "e" });
    expect(mergeProfileUser(profile, local).organization?.logo).toBe(
      "https://cdn.example/logo.png",
    );
  });

  it("keeps a local orgId when the profile omits it", () => {
    const profile = user({ id: 9, name: "Eureka Labs" });
    const local = user({ id: 9, name: "Eureka Labs", orgId: "e" });
    expect(mergeProfileUser(profile, local).organization?.orgId).toBe("e");
  });
});
