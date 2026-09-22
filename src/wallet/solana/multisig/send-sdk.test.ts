import * as squads from "@sqds/multisig";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pendingSquadsMultisigBroadcast } from "../../types";
import { getSolanaSigner, getSquadsSdkBinding } from "../session";
import { broadcastSolanaTransaction } from "../transfer";
import { SQUADS_SDK_NO_INITIATE_MESSAGE, SQUADS_V4_PROGRAM_ID } from "./config";
import { verifySquadsBinding } from "./resolve";
import { sendViaSquadsSdk } from "./send-sdk";

vi.mock("@/lib/rpc/solana", () => ({
  getSolanaConnection: vi.fn(() => ({})),
}));

vi.mock("../session", () => ({
  getSolanaSigner: vi.fn(),
  getSquadsSdkBinding: vi.fn(),
}));

vi.mock("../transfer", () => ({
  broadcastSolanaTransaction: vi.fn(),
}));

vi.mock("./resolve", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./resolve")>();
  return {
    ...actual,
    verifySquadsBinding: vi.fn(),
  };
});

const PLACEHOLDER_BLOCKHASH = "11111111111111111111111111111111";

function innerDeposit(payer: PublicKey) {
  const message = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: PLACEHOLDER_BLOCKHASH,
    instructions: [
      SystemProgram.transfer({
        fromPubkey: payer,
        toPubkey: Keypair.generate().publicKey,
        lamports: 1n,
      }),
    ],
  }).compileToV0Message();
  return new VersionedTransaction(message);
}

function outerTx(call: number) {
  return vi.mocked(broadcastSolanaTransaction).mock.calls[call]?.[0] as Transaction;
}

function instructionTouches(tx: Transaction, address: PublicKey) {
  return tx.instructions.some((instruction) => instruction.keys.some((key) => key.pubkey.equals(address)));
}

describe("sendViaSquadsSdk", () => {
  const member = Keypair.generate();
  const createKey = Keypair.generate().publicKey;
  const [multisigPda] = squads.getMultisigPda({ createKey });
  const [vault] = squads.getVaultPda({ multisigPda, index: 0 });
  const binding = {
    member: member.publicKey.toBase58(),
    vaultAddress: vault.toBase58(),
    multisigPda: multisigPda.toBase58(),
    vaultIndex: 0,
  };

  beforeEach(() => {
    vi.mocked(getSolanaSigner).mockReturnValue({
      publicKey: member.publicKey,
      signTransaction: async (tx) => tx,
    });
    vi.mocked(getSquadsSdkBinding).mockReturnValue(binding);
    vi.mocked(verifySquadsBinding).mockResolvedValue({
      ...binding,
      threshold: 1,
      members: [binding.member],
      canInitiate: true,
    });
    vi.mocked(broadcastSolanaTransaction).mockResolvedValue({
      signature: "sig",
      signed: new Transaction(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.mocked(broadcastSolanaTransaction).mockReset();
  });

  it("creates a vault transaction then a proposal at current index + 1", async () => {
    vi.spyOn(squads.accounts.Multisig, "fromAccountAddress").mockResolvedValue({
      transactionIndex: 7n,
    } as never);
    const [transactionPda] = squads.getTransactionPda({ multisigPda, index: 8n });
    const [proposalPda] = squads.getProposalPda({ multisigPda, transactionIndex: 8n });

    await expect(sendViaSquadsSdk(innerDeposit(vault))).resolves.toEqual(
      pendingSquadsMultisigBroadcast({
        vaultAddress: vault.toBase58(),
        multisigPda: multisigPda.toBase58(),
        transactionIndex: 8n,
      }),
    );

    expect(broadcastSolanaTransaction).toHaveBeenCalledTimes(1);
    const outer = outerTx(0);
    expect(outer.instructions).toHaveLength(2);
    expect(outer.instructions[0]?.programId.equals(SQUADS_V4_PROGRAM_ID)).toBe(true);
    expect(outer.instructions[1]?.programId.equals(SQUADS_V4_PROGRAM_ID)).toBe(true);
    expect(instructionTouches(outer, transactionPda)).toBe(true);
    expect(instructionTouches(outer, proposalPda)).toBe(true);
    expect(outer.feePayer?.equals(member.publicKey)).toBe(true);
  });

  it("retries once after an index conflict", async () => {
    vi.spyOn(squads.accounts.Multisig, "fromAccountAddress")
      .mockResolvedValueOnce({ transactionIndex: 3n } as never)
      .mockResolvedValueOnce({ transactionIndex: 4n } as never);
    vi.mocked(broadcastSolanaTransaction)
      .mockRejectedValueOnce(new Error("already in use"))
      .mockResolvedValueOnce({ signature: "sig", signed: new Transaction() });
    const [firstPda] = squads.getTransactionPda({ multisigPda, index: 4n });
    const [secondPda] = squads.getTransactionPda({ multisigPda, index: 5n });

    await expect(sendViaSquadsSdk(innerDeposit(vault))).resolves.toEqual(
      pendingSquadsMultisigBroadcast({
        vaultAddress: vault.toBase58(),
        multisigPda: multisigPda.toBase58(),
        transactionIndex: 5n,
      }),
    );
    expect(broadcastSolanaTransaction).toHaveBeenCalledTimes(2);
    expect(instructionTouches(outerTx(0), firstPda)).toBe(true);
    expect(instructionTouches(outerTx(1), secondPda)).toBe(true);
  });

  it("throws when the retried create still collides", async () => {
    vi.spyOn(squads.accounts.Multisig, "fromAccountAddress").mockResolvedValue({
      transactionIndex: 1n,
    } as never);
    vi.mocked(broadcastSolanaTransaction).mockRejectedValue(new Error("already in use"));

    await expect(sendViaSquadsSdk(innerDeposit(vault))).rejects.toThrow("already in use");
    expect(broadcastSolanaTransaction).toHaveBeenCalledTimes(2);
  });

  it("does not broadcast when the member cannot initiate", async () => {
    vi.mocked(verifySquadsBinding).mockResolvedValue({
      ...binding,
      threshold: 1,
      members: [binding.member],
      canInitiate: false,
    });

    await expect(sendViaSquadsSdk(innerDeposit(vault))).rejects.toThrow(SQUADS_SDK_NO_INITIATE_MESSAGE);
    expect(broadcastSolanaTransaction).not.toHaveBeenCalled();
  });
});
