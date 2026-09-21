import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { ComputeBudgetProgram, Keypair, SystemProgram, type Connection } from "@solana/web3.js";
import { describe, expect, it } from "vitest";
import {
  SOLANA_MAX_COMPUTE_UNIT_LIMIT,
  SOLANA_MIN_COMPUTE_UNIT_LIMIT,
  SOLANA_MISSING_OUTPUTS_MESSAGE,
  SOLANA_OUTPUT_AMOUNT_MISMATCH_MESSAGE,
} from "./config";
import {
  buildSolanaDepositInstructions,
  mergeDepositOutputs,
  solanaDepositComputeUnitLimit,
} from "./build-deposit-tx";

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

describe("solanaDepositComputeUnitLimit", () => {
  it("floors a small SPL transfer at the Solana default", () => {
    expect(solanaDepositComputeUnitLimit({ createAtaCount: 0, transferCount: 1 }))
      .toBe(SOLANA_MIN_COMPUTE_UNIT_LIMIT);
  });

  it("raises the limit when every destination needs an ATA", () => {
    const units = solanaDepositComputeUnitLimit({ createAtaCount: 10, transferCount: 10 });
    expect(units).toBeGreaterThan(SOLANA_MIN_COMPUTE_UNIT_LIMIT);
    expect(units).toBeLessThanOrEqual(SOLANA_MAX_COMPUTE_UNIT_LIMIT);
  });

  it("caps a huge batch at the runtime maximum", () => {
    expect(solanaDepositComputeUnitLimit({ createAtaCount: 80, transferCount: 80 }))
      .toBe(SOLANA_MAX_COMPUTE_UNIT_LIMIT);
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

  it("prepends a compute budget and idempotent ATA creates for missing destinations", async () => {
    const payer = Keypair.generate().publicKey;
    const destA = Keypair.generate().publicKey;
    const destB = Keypair.generate().publicKey;
    const mint = Keypair.generate().publicKey;
    const instructions = await buildSolanaDepositInstructions({
      connection,
      payer,
      mint: mint.toBase58(),
      outputs: [
        { address: destA.toBase58(), amount: "1", amountRaw: "10" },
        { address: destB.toBase58(), amount: "2", amountRaw: "5" },
      ],
      totalSourceAmountRaw: 15n,
    });

    expect(instructions).toHaveLength(5);
    expect(instructions[0].programId.equals(ComputeBudgetProgram.programId)).toBe(true);
    expect(instructions[0].data[0]).toBe(2);
    const units = Buffer.from(instructions[0].data).readUInt32LE(1);
    expect(units).toBe(solanaDepositComputeUnitLimit({ createAtaCount: 2, transferCount: 2 }));

    expect(instructions[1].programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID)).toBe(true);
    expect(Array.from(instructions[1].data)).toEqual([1]);
    expect(instructions[2].programId.equals(TOKEN_PROGRAM_ID)).toBe(true);
    expect(instructions[3].programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID)).toBe(true);
    expect(Array.from(instructions[3].data)).toEqual([1]);
    expect(instructions[4].programId.equals(TOKEN_PROGRAM_ID)).toBe(true);
  });
});
