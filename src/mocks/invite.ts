/**
 * TODO(api): mock data until the invite contract exists.
 * Replace with:
 *   1. types in src/types/<domain>.ts
 *   2. a function in src/api/<domain>.ts
 *   3. a key in src/api/query-keys.ts
 *   4. queryFn -> the real api function
 *   5. delete src/mocks/invite.ts and its MOCK_ENABLED entry
 */
import { HEADER_AVATAR_SRC } from "@/components/layout/config";
import { AUTH_USER_ROLE, type AuthSession } from "@/types/auth";
import { readIntegrationSettings, type IntegrationSettings } from "./settings";

export type InvitePreview = {
  orgId: string;
  organizationName: string;
  inviterEmail: string;
  inviterAvatar: string;
  integration: IntegrationSettings;
};

export type InviteRegisterInput = {
  orgId: string;
  name: string;
  email: string;
  password: string;
  position?: string;
  telegram?: string;
  slack?: string;
  wallets?: {
    evm: string;
    solana: string;
    near: string;
    tron: string;
  };
};

const PREVIEWS: Record<string, Omit<InvitePreview, "integration">> = {
  default: {
    orgId: "default",
    organizationName: "Eureka Labs",
    inviterEmail: "abc@gmail.com",
    inviterAvatar: HEADER_AVATAR_SRC,
  },
};

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function getInvitePreview(orgId: string): Promise<InvitePreview> {
  await delay(300);
  const trimmed = orgId.trim();
  if (!trimmed) {
    throw new Error("Invite link is missing an organization");
  }
  return {
    ...(PREVIEWS[trimmed] ?? PREVIEWS.default),
    orgId: trimmed,
    integration: readIntegrationSettings(),
  };
}

export async function registerWithInvite(input: InviteRegisterInput): Promise<AuthSession> {
  const preview = await getInvitePreview(input.orgId);
  return {
    token: `mock:invite:${preview.orgId}`,
    user: {
      id: Date.now(),
      email: input.email.trim(),
      name: input.name.trim(),
      role: AUTH_USER_ROLE.Employee,
      organization: { name: preview.organizationName },
    },
  };
}
