import { describe, expect, it } from "vitest";
import { TEAM_SCHEDULE } from "@/hooks/use-team-api";
import {
  emailFieldError,
  memberDisplayWallet,
  memberMatchesSearch,
  teamMemberFormCanSave,
  walletFieldError,
} from "./utils";

const VALID_EVM = "0x557be3f47a45499385f60cd64e2ff455e42a3311";
const VALID_SOL = "9JXR51yBLBgfesHF8SJgKWkNnx4FxtJCxCc3AV31TBsn";

describe("team form validation", () => {
  it("skips empty wallets and rejects an EVM address in the Solana field", () => {
    expect(walletFieldError("", "solana")).toBeNull();
    expect(walletFieldError(VALID_EVM, "solana")).toBe("Invalid Solana address");
    expect(walletFieldError(VALID_SOL, "solana")).toBeNull();
  });

  it("requires a name and valid filled fields to save", () => {
    expect(
      teamMemberFormCanSave({
        name: "",
        email: "",
        wallets: { evm: "", solana: "", near: "" },
      }),
    ).toBe(false);
    expect(
      teamMemberFormCanSave({
        name: "Andrew",
        email: "not-an-email",
        wallets: { evm: "", solana: "", near: "" },
      }),
    ).toBe(false);
    expect(
      teamMemberFormCanSave({
        name: "Andrew",
        email: "andrew@gmail.com",
        wallets: { evm: VALID_EVM, solana: VALID_EVM, near: "" },
      }),
    ).toBe(false);
    expect(
      teamMemberFormCanSave({
        name: "Andrew",
        email: "",
        wallets: { evm: "", solana: "", near: "" },
      }),
    ).toBe(true);
  });

  it("picks EVM then Solana then NEAR for the table wallet", () => {
    expect(
      memberDisplayWallet({
        wallets: { evm: VALID_EVM, solana: VALID_SOL, near: "alice.near" },
      }),
    ).toBe(VALID_EVM);
    expect(
      memberDisplayWallet({
        wallets: { evm: "", solana: VALID_SOL, near: "alice.near" },
      }),
    ).toBe(VALID_SOL);
    expect(memberDisplayWallet({ wallets: { evm: "", solana: "", near: "" } })).toBeNull();
  });

  it("filters members by name, email, or wallet", () => {
    const row = {
      id: "member-1",
      name: "Hannah Petty",
      position: "BD",
      schedule: TEAM_SCHEDULE.Monthly,
      email: "hannah@gmail.com",
      wallets: { evm: VALID_EVM, solana: "", near: "" },
    };
    expect(memberMatchesSearch(row, "hannah")).toBe(true);
    expect(memberMatchesSearch(row, VALID_EVM.slice(0, 8))).toBe(true);
    expect(memberMatchesSearch(row, "zoey")).toBe(false);
    expect(emailFieldError("hannah@gmail.com")).toBeNull();
  });
});
