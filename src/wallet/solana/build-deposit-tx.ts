/**
 * Build an unsigned Solana deposit transaction from one quote batch's outputs.
 */

import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  ComputeBudgetProgram,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
  type Connection,
} from "@solana/web3.js";
import type { PayBatchSwapOutput } from "@/types/payout";
import { getSolanaConnection } from "@/lib/rpc/solana";
import {
  SOLANA_ATA_ALLOW_OWNER_OFF_CURVE,
  SOLANA_ATA_CREATE_COMPUTE_UNITS,
  SOLANA_COMPUTE_UNIT_HEADROOM,
  SOLANA_MAX_COMPUTE_UNIT_LIMIT,
  SOLANA_MIN_COMPUTE_UNIT_LIMIT,
  SOLANA_MISSING_OUTPUTS_MESSAGE,
  SOLANA_OUTPUT_AMOUNT_MISMATCH_MESSAGE,
  SOLANA_SPL_TRANSFER_COMPUTE_UNITS,
} from "./config";

export type MergedDepositOutput = {
  address: string;
  amountRaw: bigint;
};

export function solanaDepositComputeUnitLimit(input: {
  createAtaCount: number;
  transferCount: number;
}): number {
  const estimated =
    SOLANA_COMPUTE_UNIT_HEADROOM
    + Math.max(0, input.createAtaCount) * SOLANA_ATA_CREATE_COMPUTE_UNITS
    + Math.max(0, input.transferCount) * SOLANA_SPL_TRANSFER_COMPUTE_UNITS;
  return Math.min(
    SOLANA_MAX_COMPUTE_UNIT_LIMIT,
    Math.max(SOLANA_MIN_COMPUTE_UNIT_LIMIT, estimated),
  );
}

function parsePositiveAmountRaw(value: string): bigint {
  const trimmed = value.trim();
  if (!/^[0-9]+$/.test(trimmed)) {
    throw new Error(SOLANA_OUTPUT_AMOUNT_MISMATCH_MESSAGE);
  }
  const amount = BigInt(trimmed);
  if (amount <= 0n) throw new Error(SOLANA_OUTPUT_AMOUNT_MISMATCH_MESSAGE);
  return amount;
}

export function mergeDepositOutputs(
  outputs: readonly PayBatchSwapOutput[],
  totalSourceAmountRaw: bigint,
): MergedDepositOutput[] {
  if (!outputs.length) throw new Error(SOLANA_MISSING_OUTPUTS_MESSAGE);

  const merged = new Map<string, bigint>();
  for (const output of outputs) {
    const address = output.address.trim();
    if (!address) throw new Error(SOLANA_MISSING_OUTPUTS_MESSAGE);
    const amount = parsePositiveAmountRaw(output.amountRaw);
    merged.set(address, (merged.get(address) ?? 0n) + amount);
  }

  const rows = [...merged.entries()].map(([address, amountRaw]) => ({ address, amountRaw }));
  const sum = rows.reduce((total, row) => total + row.amountRaw, 0n);
  if (sum !== totalSourceAmountRaw) {
    throw new Error(SOLANA_OUTPUT_AMOUNT_MISMATCH_MESSAGE);
  }
  return rows;
}

async function tokenProgramForMint(connection: Connection, mint: PublicKey): Promise<PublicKey> {
  const info = await connection.getAccountInfo(mint, "confirmed");
  return info?.owner.equals(TOKEN_2022_PROGRAM_ID) ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
}

async function destinationTokenAccount(input: {
  connection: Connection;
  mint: PublicKey;
  dest: PublicKey;
  programId: PublicKey;
}): Promise<{ tokenAccount: PublicKey; createAta: boolean }> {
  try {
    const existing = await getAccount(input.connection, input.dest, "confirmed", input.programId);
    if (existing.mint.equals(input.mint)) {
      return { tokenAccount: input.dest, createAta: false };
    }
  } catch {
    // Destination is not a token account for this program.
  }

  const ata = getAssociatedTokenAddressSync(
    input.mint,
    input.dest,
    SOLANA_ATA_ALLOW_OWNER_OFF_CURVE,
    input.programId,
  );
  try {
    await getAccount(input.connection, ata, "confirmed", input.programId);
    return { tokenAccount: ata, createAta: false };
  } catch {
    return { tokenAccount: ata, createAta: true };
  }
}

export async function buildSolanaDepositInstructions(input: {
  connection: Connection;
  payer: PublicKey;
  mint?: string | null;
  outputs: readonly PayBatchSwapOutput[];
  totalSourceAmountRaw: bigint;
}): Promise<TransactionInstruction[]> {
  const rows = mergeDepositOutputs(input.outputs, input.totalSourceAmountRaw);
  const mintAddress = input.mint?.trim();
  if (!mintAddress) {
    return rows.map((row) => SystemProgram.transfer({
      fromPubkey: input.payer,
      toPubkey: new PublicKey(row.address),
      lamports: row.amountRaw,
    }));
  }

  const mint = new PublicKey(mintAddress);
  const programId = await tokenProgramForMint(input.connection, mint);
  const fromTokenAccount = getAssociatedTokenAddressSync(
    mint,
    input.payer,
    SOLANA_ATA_ALLOW_OWNER_OFF_CURVE,
    programId,
  );
  const instructions: TransactionInstruction[] = [];
  let createAtaCount = 0;
  for (const row of rows) {
    const dest = new PublicKey(row.address);
    const { tokenAccount, createAta } = await destinationTokenAccount({
      connection: input.connection,
      mint,
      dest,
      programId,
    });
    if (createAta) {
      createAtaCount += 1;
      instructions.push(
        createAssociatedTokenAccountIdempotentInstruction(
          input.payer,
          tokenAccount,
          dest,
          mint,
          programId,
        ),
      );
    }
    instructions.push(
      createTransferInstruction(
        fromTokenAccount,
        tokenAccount,
        input.payer,
        row.amountRaw,
        [],
        programId,
      ),
    );
  }
  return [
    ComputeBudgetProgram.setComputeUnitLimit({
      units: solanaDepositComputeUnitLimit({
        createAtaCount,
        transferCount: rows.length,
      }),
    }),
    ...instructions,
  ];
}

export async function buildSolanaDepositTx(input: {
  payer: string;
  mint?: string | null;
  outputs: readonly PayBatchSwapOutput[];
  totalSourceAmountRaw: bigint;
}): Promise<VersionedTransaction> {
  const payer = new PublicKey(input.payer);
  const connection = getSolanaConnection();
  const instructions = await buildSolanaDepositInstructions({
    connection,
    payer,
    mint: input.mint,
    outputs: input.outputs,
    totalSourceAmountRaw: input.totalSourceAmountRaw,
  });
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  const message = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();
  return new VersionedTransaction(message);
}
