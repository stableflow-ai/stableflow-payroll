import { describe, expect, it } from "vitest";
import { toIntentsAccountId } from "./to-intents-account-id";

describe("toIntentsAccountId", () => {
  it("lowercases EVM addresses", () => {
    expect(toIntentsAccountId("0xAAAABBBBCCCCDDDDEEEEFFFF0000111122223333", "evm")).toBe(
      "0xaaaabbbbccccddddeeeeffff0000111122223333",
    );
  });

  it("lowercases NEAR account ids", () => {
    expect(toIntentsAccountId("Alice.near", "near")).toBe("alice.near");
  });

  it("encodes Solana pubkeys as 64-char hex without 0x", () => {
    expect(toIntentsAccountId("11111111111111111111111111111111", "solana")).toBe("0".repeat(64));
    expect(
      toIntentsAccountId("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", "solana"),
    ).toBe("06ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a9");
  });

  it("drops the Tron version byte and returns an EVM-shaped 0x account", () => {
    expect(toIntentsAccountId("TBXSw8fM4jpQkGc6zZjsVABFpVN7UvXPdV", "tron")).toBe(
      "0x1111111111111111111111111111111111111111",
    );
  });
});
