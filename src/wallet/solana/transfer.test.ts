import {
  Keypair,
  Transaction,
  TransactionExpiredBlockheightExceededError,
  TransactionMessage,
  VersionedMessage,
  VersionedTransaction,
  type Connection,
} from "@solana/web3.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getSolanaConnection } from "@/lib/rpc/solana";
import { SOLANA_ATA_INIT_FAILED_MESSAGE, SOLANA_EXPIRED_MESSAGE, SOLANA_TRANSFER_FAILED_MESSAGE } from "./config";
import { setSolanaSigner } from "./session";
import {
  broadcastSolanaTransaction,
  confirmSolanaSignature,
  isEmptySimulationMessage,
  isExpiredBlockhashError,
  isUnsignedSolanaTransaction,
  refreshBlockhashIfUnsigned,
  toSolanaBroadcastError,
} from "./transfer";

vi.mock("@/lib/rpc/solana", () => ({
  getSolanaConnection: vi.fn(),
  getActiveSolanaConnection: vi.fn((connection: Connection) => connection),
}));

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

  it("writes the refreshed blockhash into the serialized versioned message", async () => {
    const blockhash = Keypair.generate().publicKey.toBase58();
    const connection = mockConnection({
      getLatestBlockhash: vi.fn(async () => ({
        blockhash,
        lastValidBlockHeight: 100,
      })),
    });
    const tx = unsignedVersioned();
    await refreshBlockhashIfUnsigned(connection, tx);

    const decoded = VersionedMessage.deserialize(tx.message.serialize());
    expect(decoded.recentBlockhash).toBe(blockhash);
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

describe("toSolanaBroadcastError", () => {
  it("maps an expired blockhash to the retry copy", async () => {
    const error = await toSolanaBroadcastError(
      new Error("Transaction simulation failed: Blockhash not found"),
    );
    expect(error.message).toBe(SOLANA_EXPIRED_MESSAGE);
  });

  it("appends getLogs() lines that the wallet stripped from the message", async () => {
    const error = new Error(
      "Simulation failed. Message: Transaction simulation failed. Logs: []. Catch the `SendTransactionError` and call `getLogs()` on it for full details.",
    );
    (error as Error & { getLogs: () => Promise<string[]> }).getLogs = async () => [
      "Program ATokenGPvbdGVxr1vhZbiqW5xWHZ5eFTNslJA8knL success",
      "Program failed to complete: exceeded CUs meter at BPF instruction",
    ];
    const enriched = await toSolanaBroadcastError(error);
    expect(enriched.message).toContain("exceeded CUs meter");
    expect(enriched.message).toContain("ATokenGPvbdGVxr1vhZbiqW5xWHZ5eFTNslJA8knL success");
  });

  it("maps an empty-log simulation failure to the retry copy", async () => {
    const error = await toSolanaBroadcastError(
      new Error(
        "Simulation failed. Message: Transaction simulation failed. Logs: []. Catch the `SendTransactionError` and call `getLogs()` on it for full details.",
      ),
    );
    expect(error.message).toBe(SOLANA_EXPIRED_MESSAGE);
    expect(isEmptySimulationMessage(
      "Simulation failed. Message: Transaction simulation failed. Logs: []. Catch the `SendTransactionError` and call `getLogs()` on it for full details.",
    )).toBe(true);
  });

  it("maps an associated-token initialization failure to a short retry copy", async () => {
    const error = await toSolanaBroadcastError(
      new Error("Simulation failed. Message: Transaction simulation failed. Logs: [\"failed to initialize the associated token account\"]."),
    );
    expect(error.message).toBe(SOLANA_ATA_INIT_FAILED_MESSAGE);
  });

  it("keeps the original error when getLogs() adds nothing new", async () => {
    const error = new Error("Simulation failed");
    (error as Error & { getLogs: () => Promise<string[]> }).getLogs = async () => [];
    await expect(toSolanaBroadcastError(error)).resolves.toBe(error);
  });
});

const EMPTY_SIMULATION_MESSAGE = "Simulation failed. Message: Transaction simulation failed. Logs: []. Catch the `SendTransactionError` and call `getLogs()` on it for full details.";

describe("broadcastSolanaTransaction", () => {
  const payer = Keypair.generate();

  afterEach(() => {
    setSolanaSigner(null);
  });

  function connectionFor(input: {
    blockHeights: number[];
    sendRawTransaction: ReturnType<typeof vi.fn>;
  }) {
    const blockhash = Keypair.generate().publicKey.toBase58();
    let heightIndex = 0;
    const connection = mockConnection({
      getLatestBlockhash: vi.fn(async () => ({
        blockhash,
        lastValidBlockHeight: 100,
      })),
      getBlockHeight: vi.fn(async () => input.blockHeights[Math.min(heightIndex++, input.blockHeights.length - 1)]),
      getSignatureStatuses: vi.fn(async () => ({
        value: [{ err: null, confirmationStatus: "confirmed" }],
      })),
      sendRawTransaction: input.sendRawTransaction,
    });
    vi.mocked(getSolanaConnection).mockReturnValue(connection);
    setSolanaSigner({
      publicKey: payer.publicKey,
      signTransaction: async (tx) => tx,
    });
    return connection;
  }

  it("rebuilds and signs once when the blockhash expires before send", async () => {
    const sendRawTransaction = vi.fn(async () => "sig");
    const rebuild = vi.fn(async () => unsignedVersioned());
    connectionFor({ blockHeights: [101, 50], sendRawTransaction });

    await expect(broadcastSolanaTransaction(unsignedVersioned(), { rebuild })).resolves.toMatchObject({
      signature: "sig",
    });

    expect(rebuild).toHaveBeenCalledTimes(1);
    expect(sendRawTransaction).toHaveBeenCalledTimes(1);
  });

  it("does not rebuild a second time when the replacement also expires", async () => {
    const sendRawTransaction = vi.fn(async () => "sig");
    const rebuild = vi.fn(async () => unsignedVersioned());
    connectionFor({ blockHeights: [101, 101], sendRawTransaction });

    await expect(broadcastSolanaTransaction(unsignedVersioned(), { rebuild })).rejects.toThrow(SOLANA_EXPIRED_MESSAGE);
    expect(rebuild).toHaveBeenCalledTimes(1);
    expect(sendRawTransaction).not.toHaveBeenCalled();
  });

  it("rebuilds once after an empty-log simulation failure and then surfaces the expired copy", async () => {
    const sendRawTransaction = vi.fn(async () => {
      throw new Error(EMPTY_SIMULATION_MESSAGE);
    });
    const rebuild = vi.fn(async () => unsignedVersioned());
    connectionFor({ blockHeights: [50], sendRawTransaction });

    await expect(broadcastSolanaTransaction(unsignedVersioned(), { rebuild })).rejects.toThrow(SOLANA_EXPIRED_MESSAGE);
    expect(rebuild).toHaveBeenCalledTimes(1);
    expect(sendRawTransaction).toHaveBeenCalledTimes(2);
  });

  it("rebuilds once after an associated-token initialization failure", async () => {
    const sendRawTransaction = vi.fn(async () => {
      throw new Error("failed to initialize the associated token account");
    });
    const rebuild = vi.fn(async () => unsignedVersioned());
    connectionFor({ blockHeights: [50], sendRawTransaction });

    await expect(broadcastSolanaTransaction(unsignedVersioned(), { rebuild })).rejects.toThrow(
      SOLANA_ATA_INIT_FAILED_MESSAGE,
    );
    expect(rebuild).toHaveBeenCalledTimes(1);
    expect(sendRawTransaction).toHaveBeenCalledTimes(2);
  });
});
