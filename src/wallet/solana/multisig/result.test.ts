import { SystemProgram, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { describe, expect, it } from "vitest";
import { executedBroadcast } from "../../types";
import { SQUADS_V4_PROGRAM_ID } from "./config";
import { solanaBroadcastResult } from "./result";

const PLACEHOLDER_BLOCKHASH = "11111111111111111111111111111111";
const VAULT = "11111111111111111111111111111112";

function txForProgram(programId: typeof SystemProgram.programId) {
  const payer = SystemProgram.programId;
  const message = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: PLACEHOLDER_BLOCKHASH,
    instructions: [{ programId, keys: [], data: Buffer.alloc(0) }],
  }).compileToV0Message();
  return new VersionedTransaction(message);
}

describe("solanaBroadcastResult", () => {
  it("returns pending when SquadsX mode is active", () => {
    const signed = txForProgram(SystemProgram.programId);
    expect(solanaBroadcastResult({
      signature: "sig",
      signed,
      vaultAddress: VAULT,
      squadsMode: "squadsx",
    })).toEqual({
      kind: "pending-multisig",
      chainKind: "solana",
      vaultAddress: VAULT,
    });
  });

  it("returns pending when the signed transaction calls Squads v4", () => {
    const signed = txForProgram(SQUADS_V4_PROGRAM_ID);
    expect(solanaBroadcastResult({
      signature: "sig",
      signed,
      vaultAddress: VAULT,
      squadsMode: null,
    }).kind).toBe("pending-multisig");
  });

  it("returns executed for a plain transfer", () => {
    const signed = txForProgram(SystemProgram.programId);
    expect(solanaBroadcastResult({
      signature: "sig",
      signed,
      vaultAddress: VAULT,
      squadsMode: null,
    })).toEqual(executedBroadcast("sig"));
  });
});
