import { describe, expect, it } from "vitest";
import { defaultIntegrationSettings, FIELD_REQUIREMENT } from "@/hooks/use-settings-api";
import {
  emailFieldError,
  memberDisplayWallet,
  organizationInviteId,
  organizationInviteUrl,
  teamMemberFormCanSave,
  walletFieldError,
  walletForChainKind,
} from "./utils";

const VALID_EVM = "0x557be3f47a45499385f60cd64e2ff455e42a3311";
const VALID_SOL = "9JXR51yBLBgfesHF8SJgKWkNnx4FxtJCxCc3AV31TBsn";
const EMPTY_WALLETS = { evm: "", solana: "", near: "", tron: "" };

function profile(overrides: {
  name?: string;
  email?: string;
  telegram?: string;
  slack?: string;
  wallets?: { evm: string; solana: string; near: string; tron: string };
} = {}) {
  return {
    name: overrides.name ?? "Andrew",
    email: overrides.email ?? "andrew@gmail.com",
    telegram: overrides.telegram ?? "",
    slack: overrides.slack ?? "",
    wallets: overrides.wallets ?? { ...EMPTY_WALLETS, evm: VALID_EVM },
  };
}

describe("team form validation", () => {
  it("skips empty wallets and rejects an EVM address in the Solana field", () => {
    expect(walletFieldError("", "solana")).toBeNull();
    expect(walletFieldError(VALID_EVM, "solana")).toBe("Invalid Solana address");
    expect(walletFieldError(VALID_SOL, "solana")).toBeNull();
  });

  it("requires a name, EVM wallet, and valid enabled fields to save", () => {
    const settings = defaultIntegrationSettings();
    expect(teamMemberFormCanSave(profile({ name: "" }), settings)).toBe(false);
    expect(teamMemberFormCanSave(profile({ email: "not-an-email" }), settings)).toBe(false);
    expect(
      teamMemberFormCanSave(
        profile({ wallets: { evm: VALID_EVM, solana: VALID_EVM, near: "", tron: "" } }),
        { ...settings, solana: { enabled: true, requirement: FIELD_REQUIREMENT.Optional } },
      ),
    ).toBe(false);
    expect(
      teamMemberFormCanSave(profile({ wallets: EMPTY_WALLETS }), settings),
    ).toBe(false);
    expect(teamMemberFormCanSave(profile(), settings)).toBe(true);
  });

  it("picks EVM then NEAR then Solana then Tron for the table wallet", () => {
    expect(
      memberDisplayWallet({
        wallets: { evm: VALID_EVM, solana: VALID_SOL, near: "alice.near", tron: "Ttron" },
      }),
    ).toBe(VALID_EVM);
    expect(
      memberDisplayWallet({
        wallets: { evm: "", solana: VALID_SOL, near: "alice.near", tron: "Ttron" },
      }),
    ).toBe("alice.near");
    expect(
      memberDisplayWallet({ wallets: { evm: "", solana: "", near: "", tron: "Ttron" } }),
    ).toBe("Ttron");
    expect(memberDisplayWallet({ wallets: EMPTY_WALLETS })).toBeNull();
  });

  it("returns the wallet for a selected chain", () => {
    expect(
      walletForChainKind(
        { evm: VALID_EVM, solana: VALID_SOL, near: "alice.near", tron: "" },
        "solana",
      ),
    ).toBe(VALID_SOL);
    expect(walletForChainKind(EMPTY_WALLETS, "evm")).toBe("");
    expect(emailFieldError("hannah@gmail.com")).toBeNull();
  });

  it("builds an invite URL from the organization name", () => {
    expect(organizationInviteId("Eureka Labs")).toBe("eureka-labs");
    expect(organizationInviteId("")).toBe("default");
    expect(organizationInviteUrl("https://pay.example", "Eureka Labs")).toBe(
      "https://pay.example/invite/eureka-labs",
    );
  });
});
