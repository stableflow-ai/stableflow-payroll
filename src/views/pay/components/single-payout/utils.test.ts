import { describe, expect, it } from "vitest";
import { matchPayNowMember, teamMemberIdFromContact, teamMemberToContact } from "./utils";

const WALLETS = {
  evm: "0x557be3f47a45499385f60cd64e2ff455e42a3311",
  solana: "",
  near: "alice.near",
  tron: "",
};

const EMPTY_WALLETS = {
  evm: "",
  solana: "",
  near: "",
  tron: "",
};

const MEMBER_ID = 42;

function member(overrides: Partial<{
  id: number;
  name: string;
  email: string;
  wallets: typeof WALLETS;
}> = {}) {
  return {
    id: overrides.id ?? MEMBER_ID,
    name: overrides.name ?? "Andrew",
    position: "",
    email: overrides.email ?? "andrew@gmail.com",
    telegram: "",
    slack: "",
    wallets: overrides.wallets ?? WALLETS,
  };
}

describe("teamMemberToContact", () => {
  it("keeps wallets and still maps members who have no display wallet", () => {
    const withWallet = teamMemberToContact(member());
    expect(withWallet.wallet).toBe(WALLETS.evm);
    expect(withWallet.wallets).toEqual(WALLETS);

    const empty = teamMemberToContact(member({ wallets: EMPTY_WALLETS, email: "   " }));
    expect(empty.wallet).toBe("");
    expect(empty.email).toBeNull();
    expect(empty.wallets).toEqual(EMPTY_WALLETS);
  });
});

describe("matchPayNowMember", () => {
  it("matches a wallet on the paying member and ignores other addresses", () => {
    expect(matchPayNowMember(WALLETS.evm, "Andrew", WALLETS, MEMBER_ID)?.name).toBe("Andrew");
    expect(matchPayNowMember("alice.near", "Andrew", WALLETS, MEMBER_ID)?.wallet).toBe("alice.near");
    expect(matchPayNowMember(WALLETS.evm, "Andrew", WALLETS, MEMBER_ID, "andrew@gmail.com")?.email).toBe(
      "andrew@gmail.com",
    );
  });

  it("stores the team member id on the matched contact", () => {
    expect(matchPayNowMember(WALLETS.evm, "Andrew", WALLETS, MEMBER_ID)?.id).toBe("42");
  });
});

describe("teamMemberIdFromContact", () => {
  it("parses a positive integer contact id", () => {
    expect(teamMemberIdFromContact({
      id: "42",
      name: "Andrew",
      wallet: WALLETS.evm,
      email: null,
    })).toBe(42);
  });

  it("rejects missing, non-numeric, and non-positive ids", () => {
    expect(teamMemberIdFromContact(null)).toBeUndefined();
    expect(teamMemberIdFromContact({
      id: "pay-now",
      name: "Andrew",
      wallet: WALLETS.evm,
      email: null,
    })).toBeUndefined();
    expect(teamMemberIdFromContact({
      id: "0",
      name: "Andrew",
      wallet: WALLETS.evm,
      email: null,
    })).toBeUndefined();
  });
});
