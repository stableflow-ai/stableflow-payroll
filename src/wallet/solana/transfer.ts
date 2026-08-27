/**
 * Solana native SOL and SPL transfers to a deposit address.
 */

import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionExpiredBlockheightExceededError,
  VersionedTransaction,
} from "@solana/web3.js";
import { Buffer } from "buffer";
import { getSolanaConnection } from "@/lib/rpc/solana";
import { getSolanaSigner } from "./session";

function requireSigner() {
  const signer = getSolanaSigner();
  if (!signer) throw new Error("Connect a Solana wallet to send this payout");
  return signer;
}

async function sendSigned(transaction: Transaction): Promise<string> {
  const signer = requireSigner();
  const connection = getSolanaConnection();
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = signer.publicKey;
  const signed = await signer.signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signed.serialize());
  const confirmation = await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed",
  );
  if (confirmation.value.err) {
    throw new Error("Solana transfer failed");
  }
  return signature;
}

const SOLANA_EXPIRED_MESSAGE = "Solana transaction expired. Confirm again to retry.";

function recentBlockhashOf(tx: Transaction | VersionedTransaction): string {
  if (tx instanceof VersionedTransaction) return tx.message.recentBlockhash;
  return tx.recentBlockhash || "";
}

function isExpiredBlockhashError(error: unknown): boolean {
  if (error instanceof TransactionExpiredBlockheightExceededError) return true;
  if (!(error instanceof Error)) return false;
  return /block height exceeded|blockhash not found|blockhash.*expired/i.test(error.message);
}

export async function broadcastSerializedSolanaTx(input: {
  serializedTransaction: string;
  lastValidBlockHeight?: number;
}): Promise<string> {
  const signer = requireSigner();
  const connection = getSolanaConnection();
  const raw = Buffer.from(input.serializedTransaction, "base64");
  let unsigned: Transaction | VersionedTransaction;
  try {
    unsigned = Transaction.from(raw);
  } catch {
    unsigned = VersionedTransaction.deserialize(raw);
  }
  const signed = await signer.signTransaction(unsigned);
  const signature = await connection.sendRawTransaction(signed.serialize());
  const lastValidBlockHeight = input.lastValidBlockHeight
    ?? (await connection.getLatestBlockhash("confirmed")).lastValidBlockHeight;
  try {
    const confirmation = await connection.confirmTransaction(
      {
        signature,
        blockhash: recentBlockhashOf(signed),
        lastValidBlockHeight,
      },
      "confirmed",
    );
    if (confirmation.value.err) {
      throw new Error(SOLANA_EXPIRED_MESSAGE);
    }
  } catch (error) {
    if (error instanceof Error && error.message === SOLANA_EXPIRED_MESSAGE) throw error;
    if (isExpiredBlockhashError(error)) {
      throw new Error(SOLANA_EXPIRED_MESSAGE);
    }
    throw error;
  }
  return signature;
}

export async function transferNativeSol(input: {
  to: string;
  amountIn: bigint;
}): Promise<string> {
  const signer = requireSigner();
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: signer.publicKey,
      toPubkey: new PublicKey(input.to),
      lamports: input.amountIn,
    }),
  );
  return sendSigned(transaction);
}

export async function transferSpl(input: {
  mint: string;
  to: string;
  amountIn: bigint;
}): Promise<string> {
  const signer = requireSigner();
  const connection = getSolanaConnection();
  const mint = new PublicKey(input.mint);
  const toPubkey = new PublicKey(input.to);
  const mintInfo = await connection.getAccountInfo(mint);
  const programId = mintInfo?.owner.equals(TOKEN_2022_PROGRAM_ID) ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
  const fromTokenAccount = getAssociatedTokenAddressSync(mint, signer.publicKey, false, programId);
  const toTokenAccount = getAssociatedTokenAddressSync(mint, toPubkey, false, programId);

  const transaction = new Transaction();
  try {
    await getAccount(connection, toTokenAccount, "confirmed", programId);
  } catch {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        signer.publicKey,
        toTokenAccount,
        toPubkey,
        mint,
        programId,
      ),
    );
  }
  transaction.add(
    createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      signer.publicKey,
      input.amountIn,
      [],
      programId,
    ),
  );
  return sendSigned(transaction);
}
