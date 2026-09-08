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
  type Connection,
} from "@solana/web3.js";
import { Buffer } from "buffer";
import { getActiveSolanaConnection, getSolanaConnection } from "@/lib/rpc/solana";
import {
  SOLANA_EXPIRED_MESSAGE,
  SOLANA_REBROADCAST_INTERVAL_MS,
  SOLANA_REBROADCAST_MAX_DURATION_MS,
  SOLANA_TRANSFER_FAILED_MESSAGE,
} from "./config";
import { getSolanaSigner } from "./session";

function requireSigner() {
  const signer = getSolanaSigner();
  if (!signer) throw new Error("Connect a Solana wallet to send this payout");
  return signer;
}

function hasAnySignature(signature: Uint8Array | Buffer | null | undefined): boolean {
  return !!signature && signature.length > 0 && Array.from(signature).some((byte) => byte !== 0);
}

export function isUnsignedSolanaTransaction(tx: Transaction | VersionedTransaction): boolean {
  if (tx instanceof VersionedTransaction) {
    return tx.signatures.every((signature) => !hasAnySignature(signature));
  }
  return tx.signatures.every(({ signature }) => !hasAnySignature(signature));
}

export function isExpiredBlockhashError(error: unknown): boolean {
  if (error instanceof TransactionExpiredBlockheightExceededError) return true;
  if (!(error instanceof Error)) return false;
  return /block height exceeded|blockhash not found|blockhash.*expired/i.test(error.message);
}

export async function refreshBlockhashIfUnsigned(
  connection: Connection,
  transaction: Transaction | VersionedTransaction,
): Promise<{ blockhash: string; lastValidBlockHeight: number } | null> {
  if (!isUnsignedSolanaTransaction(transaction)) return null;

  const latest = await connection.getLatestBlockhash("confirmed");
  if (transaction instanceof VersionedTransaction) {
    (transaction.message as { recentBlockhash: string }).recentBlockhash = latest.blockhash;
  } else {
    transaction.recentBlockhash = latest.blockhash;
  }
  return latest;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type SignatureOutcome = "landed" | "failed";

async function probeSignatureOutcome(
  connection: Connection,
  signature: string,
): Promise<SignatureOutcome | undefined> {
  const { value } = await connection.getSignatureStatuses([signature]);
  const status = value?.[0];
  if (status?.err) return "failed";
  if (status?.confirmationStatus === "confirmed" || status?.confirmationStatus === "finalized") {
    return "landed";
  }
  return undefined;
}

export async function confirmSolanaSignature(params: {
  connection: Connection;
  rawTransaction: Uint8Array | Buffer;
  signature: string;
  lastValidBlockHeight?: number;
  intervalMs?: number;
  maxDurationMs?: number;
}): Promise<void> {
  const {
    connection,
    rawTransaction,
    signature,
    lastValidBlockHeight,
    intervalMs = SOLANA_REBROADCAST_INTERVAL_MS,
    maxDurationMs = SOLANA_REBROADCAST_MAX_DURATION_MS,
  } = params;
  const startedAt = Date.now();

  while (true) {
    try {
      const outcome = await probeSignatureOutcome(connection, signature);
      if (outcome === "failed") throw new Error(SOLANA_TRANSFER_FAILED_MESSAGE);
      if (outcome === "landed") return;

      if (lastValidBlockHeight) {
        const blockHeight = await connection.getBlockHeight("confirmed");
        if (blockHeight > lastValidBlockHeight) {
          throw new Error(SOLANA_EXPIRED_MESSAGE);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message === SOLANA_EXPIRED_MESSAGE) throw error;
      if (error instanceof Error && error.message === SOLANA_TRANSFER_FAILED_MESSAGE) throw error;
      // A flaky HTTP round must not end the wait; the duration cap still applies.
    }

    if (Date.now() - startedAt > maxDurationMs) {
      throw new Error(SOLANA_EXPIRED_MESSAGE);
    }

    try {
      await connection.sendRawTransaction(rawTransaction, { skipPreflight: true, maxRetries: 0 });
    } catch {
      // Already-processed transactions fail preflight; skipPreflight covers that. Other RPC
      // flakes are retried until the blockhash expires or the duration cap hits.
    }

    await sleep(intervalMs);
  }
}

async function sendAndConfirm(transaction: Transaction | VersionedTransaction): Promise<string> {
  const signer = requireSigner();
  const connection = getSolanaConnection();

  if (transaction instanceof Transaction && !transaction.feePayer) {
    transaction.feePayer = signer.publicKey;
  }

  const latest = await refreshBlockhashIfUnsigned(connection, transaction);
  const sendConnection = getActiveSolanaConnection(connection);
  const signed = await signer.signTransaction(transaction);
  const rawTransaction = signed.serialize();

  let signature: string;
  try {
    signature = await sendConnection.sendRawTransaction(rawTransaction, { skipPreflight: false });
  } catch (error) {
    if (isExpiredBlockhashError(error)) throw new Error(SOLANA_EXPIRED_MESSAGE);
    throw error;
  }

  await confirmSolanaSignature({
    connection: sendConnection,
    rawTransaction,
    signature,
    lastValidBlockHeight: latest?.lastValidBlockHeight,
  });

  return signature;
}

export async function broadcastSerializedSolanaTx(input: {
  serializedTransaction: string;
}): Promise<string> {
  const raw = Buffer.from(input.serializedTransaction, "base64");
  let unsigned: Transaction | VersionedTransaction;
  try {
    unsigned = Transaction.from(raw);
  } catch {
    unsigned = VersionedTransaction.deserialize(raw);
  }
  return sendAndConfirm(unsigned);
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
  return sendAndConfirm(transaction);
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
  return sendAndConfirm(transaction);
}
