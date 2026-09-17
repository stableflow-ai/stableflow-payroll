import { describe, expect, it } from "vitest";
import { isSafeTxStatusTerminal, safeClientTransactionUrl } from "./watch";

describe("isSafeTxStatusTerminal", () => {
  it("treats success, failure, and cancel as terminal", () => {
    expect(isSafeTxStatusTerminal("SUCCESS")).toBe(true);
    expect(isSafeTxStatusTerminal("failed")).toBe(true);
    expect(isSafeTxStatusTerminal("CANCELLED")).toBe(true);
    expect(isSafeTxStatusTerminal("AWAITING_CONFIRMATIONS")).toBe(false);
    expect(isSafeTxStatusTerminal("AWAITING_EXECUTION")).toBe(false);
    expect(isSafeTxStatusTerminal(null)).toBe(false);
  });
});

describe("safeClientTransactionUrl", () => {
  it("builds the client-gateway id from the Safe and hash", () => {
    expect(safeClientTransactionUrl(
      1,
      "0xSafe",
      "0xHash",
    )).toBe("https://safe-client.safe.global/v1/chains/1/transactions/multisig_0xSafe_0xHash");
  });
});
