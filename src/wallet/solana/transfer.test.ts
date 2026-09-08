import {
  Keypair,
  Transaction,
  TransactionExpiredBlockheightExceededError,
  TransactionMessage,
  VersionedTransaction,
  type Connection,
} from "@solana/web3.js";
import { describe, expect, it, vi } from "vitest";
import { SOLANA_EXPIRED_MESSAGE, SOLANA_TRANSFER_FAILED_MESSAGE } from "./config";
import {
  confirmSolanaSignature,
  isExpiredBlockhashError,
  isUnsignedSolanaTransaction,
  refreshBlockhashIfUnsigned,
} from "./transfer";

const PLACEHOLDER_BLOCKHASH = "11111111111111111111111111111111";
const FRESH_BLOCKHASH = "FreshBlockhash111111111111111111111111111";

function mockConnection(overrides: Record<string, unknown> = {}): Connection {
  return {
    getLatestBlockhash: vi.fn(async () => ({
      blockhash: FRESH_BLOCKHASH,
      lastValidBlockHeight: 100,
    })),
    ...overrides,
  } as unknown as Connection;
}

function unsignedLegacy(): Transaction {
  const tx = new Transaction();
  tx.feePayer = Keypair.generate().publicKey;
  tx.recentBlockhash = PLACEHOLDER_BLOCKHASH;
  return tx;
}

function signedLegacy(): Transaction {
  const payer = Keypair.generate();
  const tx = new Transaction();
  tx.feePayer = payer.publicKey;
  tx.recentBlockhash = PLACEHOLDER_BLOCKHASH;
  tx.sign(payer);
  return tx;
}

function unsignedVersioned(): VersionedTransaction {
  const message = new TransactionMessage({
    payerKey: Keypair.generate().publicKey,
    recentBlockhash: PLACEHOLDER_BLOCKHASH,
    instructions: [],
  }).compileToV0Message();
  return new VersionedTransaction(message);
}

function signedVersioned(): VersionedTransaction {
  const payer = Keypair.generate();
  const message = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: PLACEHOLDER_BLOCKHASH,
    instructions: [],
  }).compileToV0Message();
  const tx = new VersionedTransaction(message);
  tx.sign([payer]);
  return tx;
}

describe("isUnsignedSolanaTransaction", () => {
  it("treats a new legacy transaction as unsigned", () => {
    expect(isUnsignedSolanaTransaction(unsignedLegacy())).toBe(true);
  });

  it("treats a signed legacy transaction as signed", () => {
    expect(isUnsignedSolanaTransaction(signedLegacy())).toBe(false);
  });

  it("treats a new versioned transaction as unsigned", () => {
    expect(isUnsignedSolanaTransaction(unsignedVersioned())).toBe(true);
  });

  it("treats a signed versioned transaction as signed", () => {
    expect(isUnsignedSolanaTransaction(signedVersioned())).toBe(false);
  });
});

describe("refreshBlockhashIfUnsigned", () => {
  it("writes a confirmed blockhash onto an unsigned legacy transaction", async () => {
    const connection = mockConnection();
    const tx = unsignedLegacy();
    const latest = await refreshBlockhashIfUnsigned(connection, tx);

    expect(latest).toEqual({ blockhash: FRESH_BLOCKHASH, lastValidBlockHeight: 100 });
    expect(tx.recentBlockhash).toBe(FRESH_BLOCKHASH);
    expect(connection.getLatestBlockhash).toHaveBeenCalledWith("confirmed");
  });

  it("writes a confirmed blockhash onto an unsigned versioned transaction", async () => {
    const connection = mockConnection();
    const tx = unsignedVersioned();
    const latest = await refreshBlockhashIfUnsigned(connection, tx);

    expect(latest?.blockhash).toBe(FRESH_BLOCKHASH);
    expect(tx.message.recentBlockhash).toBe(FRESH_BLOCKHASH);
  });

  it("does not mutate a signed legacy transaction", async () => {
    const connection = mockConnection();
    const tx = signedLegacy();
    const latest = await refreshBlockhashIfUnsigned(connection, tx);

    expect(latest).toBeNull();
    expect(tx.recentBlockhash).toBe(PLACEHOLDER_BLOCKHASH);
    expect(connection.getLatestBlockhash).not.toHaveBeenCalled();
  });

  it("does not mutate a signed versioned transaction", async () => {
    const connection = mockConnection();
    const tx = signedVersioned();
    const latest = await refreshBlockhashIfUnsigned(connection, tx);

    expect(latest).toBeNull();
    expect(tx.message.recentBlockhash).toBe(PLACEHOLDER_BLOCKHASH);
    expect(connection.getLatestBlockhash).not.toHaveBeenCalled();
  });
});

describe("isExpiredBlockhashError", () => {
  it("detects TransactionExpiredBlockheightExceededError", () => {
    expect(isExpiredBlockhashError(new TransactionExpiredBlockheightExceededError("sig"))).toBe(true);
  });

  it("detects BlockhashNotFound simulation errors", () => {
    expect(isExpiredBlockhashError(new Error("Transaction simulation failed: Blockhash not found"))).toBe(true);
  });

  it("does not treat a generic send failure as expiry", () => {
    expect(isExpiredBlockhashError(new Error("Solana transfer failed"))).toBe(false);
  });
});

describe("confirmSolanaSignature", () => {
  it("returns when the signature is confirmed over HTTP", async () => {
    const sendRawTransaction = vi.fn();
    const connection = mockConnection({
      getSignatureStatuses: vi.fn(async () => ({
        value: [{ err: null, confirmationStatus: "confirmed" }],
      })),
      sendRawTransaction,
    });

    await confirmSolanaSignature({
      connection,
      rawTransaction: new Uint8Array([1]),
      signature: "sig",
      lastValidBlockHeight: 10,
      intervalMs: 0,
      maxDurationMs: 1_000,
    });

    expect(sendRawTransaction).not.toHaveBeenCalled();
  });

  it("throws the transfer-failed message when the on-chain result is an error", async () => {
    const connection = mockConnection({
      getSignatureStatuses: vi.fn(async () => ({
        value: [{ err: { InstructionError: [0, "Custom"] }, confirmationStatus: "confirmed" }],
      })),
      sendRawTransaction: vi.fn(),
    });

    await expect(
      confirmSolanaSignature({
        connection,
        rawTransaction: new Uint8Array([1]),
        signature: "sig",
        intervalMs: 0,
        maxDurationMs: 1_000,
      }),
    ).rejects.toThrow(SOLANA_TRANSFER_FAILED_MESSAGE);
  });

  it("throws the expired message when the blockhash height is exceeded", async () => {
    const connection = mockConnection({
      getSignatureStatuses: vi.fn(async () => ({ value: [null] })),
      getBlockHeight: vi.fn(async () => 11),
      sendRawTransaction: vi.fn(),
    });

    await expect(
      confirmSolanaSignature({
        connection,
        rawTransaction: new Uint8Array([1]),
        signature: "sig",
        lastValidBlockHeight: 10,
        intervalMs: 0,
        maxDurationMs: 1_000,
      }),
    ).rejects.toThrow(SOLANA_EXPIRED_MESSAGE);
  });

  it("rebroadcasts the same raw transaction until it lands", async () => {
    const sendRawTransaction = vi.fn(async () => "sig");
    const getSignatureStatuses = vi
      .fn()
      .mockResolvedValueOnce({ value: [null] })
      .mockResolvedValueOnce({
        value: [{ err: null, confirmationStatus: "finalized" }],
      });
    const connection = mockConnection({
      getSignatureStatuses,
      getBlockHeight: vi.fn(async () => 5),
      sendRawTransaction,
    });

    await confirmSolanaSignature({
      connection,
      rawTransaction: new Uint8Array([9, 8]),
      signature: "sig",
      lastValidBlockHeight: 10,
      intervalMs: 0,
      maxDurationMs: 1_000,
    });

    expect(sendRawTransaction).toHaveBeenCalledWith(new Uint8Array([9, 8]), {
      skipPreflight: true,
      maxRetries: 0,
    });
  });
});
