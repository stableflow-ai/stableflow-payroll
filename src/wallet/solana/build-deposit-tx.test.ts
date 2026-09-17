import { Keypair, SystemProgram, type Connection } from "@solana/web3.js";
import { describe, expect, it } from "vitest";
import {
  SOLANA_MISSING_OUTPUTS_MESSAGE,
  SOLANA_OUTPUT_AMOUNT_MISMATCH_MESSAGE,
} from "./config";
import { buildSolanaDepositInstructions, mergeDepositOutputs } from "./build-deposit-tx";

describe("mergeDepositOutputs", () => {
  it("merges outputs that share an address", () => {
    expect(mergeDepositOutputs([
      { address: "AddrA", amount: "1", amountRaw: "10" },
      { address: "AddrA", amount: "2", amountRaw: "15" },
    ], 25n)).toEqual([{ address: "AddrA", amountRaw: 25n }]);
  });

  it("keeps distinct addresses as separate transfers", () => {
    expect(mergeDepositOutputs([
      { address: "AddrA", amount: "1", amountRaw: "10" },
      { address: "AddrB", amount: "2", amountRaw: "5" },
    ], 15n)).toEqual([
      { address: "AddrA", amountRaw: 10n },
      { address: "AddrB", amountRaw: 5n },
    ]);
  });

  it("rejects an empty list", () => {
    expect(() => mergeDepositOutputs([], 1n)).toThrow(SOLANA_MISSING_OUTPUTS_MESSAGE);
  });

  it("rejects a missing address", () => {
    expect(() => mergeDepositOutputs([
      { address: "  ", amount: "1", amountRaw: "10" },
    ], 10n)).toThrow(SOLANA_MISSING_OUTPUTS_MESSAGE);
  });

  it("rejects a total that does not match the quote", () => {
    expect(() => mergeDepositOutputs([
      { address: "AddrA", amount: "1", amountRaw: "10" },
    ], 11n)).toThrow(SOLANA_OUTPUT_AMOUNT_MISMATCH_MESSAGE);
  });
});

describe("buildSolanaDepositInstructions", () => {
  const connection = {
    getAccountInfo: async () => null,
  } as unknown as Connection;

  it("builds one native transfer after merging the same destination", async () => {
    const payer = Keypair.generate().publicKey;
    const dest = Keypair.generate().publicKey;
    const instructions = await buildSolanaDepositInstructions({
      connection,
      payer,
      mint: null,
      outputs: [
        { address: dest.toBase58(), amount: "1", amountRaw: "10" },
        { address: dest.toBase58(), amount: "2", amountRaw: "5" },
      ],
      totalSourceAmountRaw: 15n,
    });
    expect(instructions).toHaveLength(1);
    expect(instructions[0].programId.equals(SystemProgram.programId)).toBe(true);
  });

  it("builds one native transfer per destination", async () => {
    const payer = Keypair.generate().publicKey;
    const destA = Keypair.generate().publicKey;
    const destB = Keypair.generate().publicKey;
    const instructions = await buildSolanaDepositInstructions({
      connection,
      payer,
      mint: null,
      outputs: [
        { address: destA.toBase58(), amount: "1", amountRaw: "10" },
        { address: destB.toBase58(), amount: "2", amountRaw: "5" },
      ],
      totalSourceAmountRaw: 15n,
    });
    expect(instructions).toHaveLength(2);
  });
});
