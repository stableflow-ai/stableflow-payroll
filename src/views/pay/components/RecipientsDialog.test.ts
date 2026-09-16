import { describe, expect, it } from "vitest";
import type { Contact } from "@/hooks/use-contacts";
import { recipientRowWallet } from "./RecipientsDialog";

const CONTACT: Contact = {
  id: "1",
  name: "Andrew",
  wallet: "0x557be3f47a45499385f60cd64e2ff455e42a3311",
  email: null,
  wallets: {
    evm: "0x557be3f47a45499385f60cd64e2ff455e42a3311",
    solana: "",
    near: "alice.near",
    tron: "",
  },
};

describe("recipientRowWallet", () => {
  it("returns the wallet for the selected chain tab", () => {
    expect(recipientRowWallet(CONTACT, "evm")).toBe(CONTACT.wallets?.evm);
    expect(recipientRowWallet(CONTACT, "near")).toBe("alice.near");
    expect(recipientRowWallet(CONTACT, "solana")).toBe("");
  });

  it("disables select when the tab has no address", () => {
    expect(Boolean(recipientRowWallet(CONTACT, "solana"))).toBe(false);
    expect(Boolean(recipientRowWallet(CONTACT, "evm"))).toBe(true);
  });

  it("falls back to the contact wallet when there is no tab", () => {
    expect(recipientRowWallet({ ...CONTACT, wallets: undefined }, null)).toBe(CONTACT.wallet);
  });
});
