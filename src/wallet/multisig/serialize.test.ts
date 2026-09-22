import { describe, expect, it } from "vitest";
import {
  deserializePendingMultisig,
  isWatchablePendingMultisig,
  pendingMultisigSessionId,
  serializePendingMultisig,
} from "./serialize";

describe("isWatchablePendingMultisig", () => {
  it("requires a Squads transaction index", () => {
    expect(isWatchablePendingMultisig({
      kind: "pending-multisig",
      chainKind: "solana",
      vaultAddress: "Vault111111111111111111111111111111111111111",
    })).toBe(false);
    expect(isWatchablePendingMultisig({
      kind: "pending-multisig",
      chainKind: "solana",
      vaultAddress: "Vault111111111111111111111111111111111111111",
      multisigPda: "Ms11111111111111111111111111111111111111111",
      transactionIndex: 3n,
    })).toBe(true);
    expect(isWatchablePendingMultisig({
      kind: "pending-multisig",
      chainKind: "evm",
      safeTxHash: "0xabc",
      safeAddress: "0xsafe",
      chainId: 1,
    })).toBe(true);
  });
});

describe("serializePendingMultisig", () => {
  it("stores a Squads index as a decimal string", () => {
    const stored = serializePendingMultisig({
      kind: "pending-multisig",
      chainKind: "solana",
      vaultAddress: "vault",
      multisigPda: "pda",
      transactionIndex: 9n,
    });
    expect(stored).toEqual({
      chainKind: "solana",
      vaultAddress: "vault",
      multisigPda: "pda",
      transactionIndex: "9",
    });
    expect(deserializePendingMultisig(stored)).toEqual({
      kind: "pending-multisig",
      chainKind: "solana",
      vaultAddress: "vault",
      multisigPda: "pda",
      transactionIndex: 9n,
    });
  });
});

describe("pendingMultisigSessionId", () => {
  it("is stable for the same proposal", () => {
    expect(pendingMultisigSessionId({
      kind: "pending-multisig",
      chainKind: "near",
      daoId: "dao.near",
      proposalId: 12,
    })).toBe("near:dao.near:12");
  });
});
