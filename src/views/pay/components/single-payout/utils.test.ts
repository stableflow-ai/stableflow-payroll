import { describe, expect, it } from "vitest";
import { matchPayNowMember } from "./utils";

const WALLETS = {
  evm: "0x557be3f47a45499385f60cd64e2ff455e42a3311",
  solana: "",
  near: "alice.near",
  tron: "",
};

describe("matchPayNowMember", () => {
  it("matches a wallet on the paying member and ignores other addresses", () => {
    expect(matchPayNowMember(WALLETS.evm, "Andrew", WALLETS)?.name).toBe("Andrew");
    expect(matchPayNowMember("alice.near", "Andrew", WALLETS)?.wallet).toBe("alice.near");
    expect(matchPayNowMember("0x541a9b0e0e1c2d3f4a5b6c7d8e9f0a1b2c3d8dc1", "Andrew", WALLETS)).toBeNull();
  });
});
