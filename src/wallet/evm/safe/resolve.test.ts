import type { Address, Hex } from "viem";
import { describe, expect, it, vi } from "vitest";
import { EXECUTION_FAILURE_TOPIC, EXECUTION_SUCCESS_TOPIC } from "./abi";
import { SAFE_LOG_SCAN_CHUNK_BLOCKS, SAFE_LOG_SCAN_MAX_CHUNKS } from "./config";

const { clientRef } = vi.hoisted(() => ({
  clientRef: { current: null as FakeClient | null },
}));

vi.mock("../balance", () => ({
  getPublicClientForChainId: () => clientRef.current,
}));

const { decodeSafeExecutionLog, resolveSafeSubmission } = await import("./resolve");

const SAFE = "0x1111111111111111111111111111111111111111" as Address;
const SAFE_TX_HASH = `0x${"ab".repeat(32)}` as Hex;
const ON_CHAIN_HASH = `0x${"cd".repeat(32)}` as Hex;
const PAYMENT_WORD = "0".repeat(64);

interface FakeLog {
  address: string;
  topics: string[];
  data: string;
  transactionHash: string | null;
}

interface FakeClient {
  getTransactionReceipt?: (args: { hash: Hex }) => Promise<unknown>;
  getBlockNumber?: () => Promise<bigint>;
  getLogs?: (args: { fromBlock: bigint; toBlock: bigint }) => Promise<FakeLog[]>;
  readContract?: (args: { blockNumber?: bigint }) => Promise<bigint>;
}

/** Safe 1.3.0 layout: `txHash` is the first word of `data`. */
function legacyLog(safeTxHash: Hex, success = true): FakeLog {
  return {
    address: SAFE,
    topics: [success ? EXECUTION_SUCCESS_TOPIC : EXECUTION_FAILURE_TOPIC],
    data: `0x${safeTxHash.slice(2)}${PAYMENT_WORD}`,
    transactionHash: ON_CHAIN_HASH,
  };
}

/** Safe 1.4.1+ layout: `txHash` is indexed into `topics[1]`. */
function indexedLog(safeTxHash: Hex, success = true): FakeLog {
  return {
    address: SAFE,
    topics: [success ? EXECUTION_SUCCESS_TOPIC : EXECUTION_FAILURE_TOPIC, safeTxHash],
    data: `0x${PAYMENT_WORD}`,
    transactionHash: ON_CHAIN_HASH,
  };
}

function useClient(client: FakeClient | null) {
  clientRef.current = client;
}

function resolve(overrides: { hash?: Hex; fromBlock?: bigint; safeNonce?: number } = {}) {
  return resolveSafeSubmission({
    chainId: 8453,
    safeAddress: SAFE,
    hash: overrides.hash ?? SAFE_TX_HASH,
    fromBlock: overrides.fromBlock ?? 100n,
    safeNonce: overrides.safeNonce ?? 7,
  });
}

const notFound = () => Promise.reject(new Error("receipt not found"));

describe("decodeSafeExecutionLog", () => {
  it("reads txHash from data on the 1.3.0 layout", () => {
    expect(decodeSafeExecutionLog(legacyLog(SAFE_TX_HASH))).toEqual({
      safeTxHash: SAFE_TX_HASH,
      success: true,
      txHash: ON_CHAIN_HASH,
    });
  });

  it("reads txHash from topics on the 1.4.1+ layout", () => {
    expect(decodeSafeExecutionLog(indexedLog(SAFE_TX_HASH))).toEqual({
      safeTxHash: SAFE_TX_HASH,
      success: true,
      txHash: ON_CHAIN_HASH,
    });
  });

  it("marks ExecutionFailure as unsuccessful in both layouts", () => {
    expect(decodeSafeExecutionLog(legacyLog(SAFE_TX_HASH, false))?.success).toBe(false);
    expect(decodeSafeExecutionLog(indexedLog(SAFE_TX_HASH, false))?.success).toBe(false);
  });

  it("ignores logs from other events", () => {
    const log = { ...legacyLog(SAFE_TX_HASH), topics: [`0x${"11".repeat(32)}`] };
    expect(decodeSafeExecutionLog(log)).toBeNull();
  });

  it("ignores logs that are not mined yet or have truncated data", () => {
    expect(decodeSafeExecutionLog({ ...legacyLog(SAFE_TX_HASH), transactionHash: null })).toBeNull();
    expect(decodeSafeExecutionLog({ ...legacyLog(SAFE_TX_HASH), data: "0x1234" })).toBeNull();
  });
});

describe("resolveSafeSubmission", () => {
  it("reports unknown when the chain has no configured client", async () => {
    useClient(null);
    const probe = await resolve();
    expect(probe.state).toBe("unknown");
    expect(probe.reason).toContain("8453");
  });

  it("treats a hash with a receipt as an already executed transaction", async () => {
    useClient({
      getTransactionReceipt: async () => ({
        status: "success",
        transactionHash: ON_CHAIN_HASH,
        logs: [legacyLog(SAFE_TX_HASH)],
      }),
    });

    expect(await resolve({ hash: ON_CHAIN_HASH })).toMatchObject({
      state: "executed",
      txHash: ON_CHAIN_HASH,
    });
  });

  it("trusts ExecutionFailure over a successful receipt status", async () => {
    useClient({
      getTransactionReceipt: async () => ({
        status: "success",
        transactionHash: ON_CHAIN_HASH,
        logs: [legacyLog(SAFE_TX_HASH, false)],
      }),
    });

    expect(await resolve({ hash: ON_CHAIN_HASH })).toMatchObject({
      state: "failed",
      txHash: ON_CHAIN_HASH,
    });
  });

  it("finds the real hash through the execution log when the hash was a safeTxHash", async () => {
    useClient({
      getTransactionReceipt: notFound,
      getBlockNumber: async () => 150n,
      getLogs: async () => [indexedLog(SAFE_TX_HASH)],
    });

    expect(await resolve()).toMatchObject({
      state: "executed",
      txHash: ON_CHAIN_HASH,
      scannedToBlock: 150n,
    });
  });

  it("stays pending while the nonce has not moved", async () => {
    useClient({
      getTransactionReceipt: notFound,
      getBlockNumber: async () => 150n,
      getLogs: async () => [],
      readContract: async () => 7n,
    });

    expect(await resolve({ safeNonce: 7 })).toMatchObject({ state: "pending", txHash: null });
  });

  it("reports cancelled once the nonce moved past the proposal and the scan is complete", async () => {
    const readContract = vi.fn(async () => 8n);
    useClient({
      getTransactionReceipt: notFound,
      getBlockNumber: async () => 150n,
      getLogs: async () => [],
      readContract,
    });

    expect(await resolve({ safeNonce: 7 })).toMatchObject({ state: "cancelled", txHash: null });
    // The nonce must be read at the scanned block so the two cannot disagree.
    expect(readContract).toHaveBeenCalledWith(expect.objectContaining({ blockNumber: 150n }));
  });

  it("stays pending when a log chunk fails even though the nonce moved", async () => {
    useClient({
      getTransactionReceipt: notFound,
      getBlockNumber: async () => 150n,
      getLogs: async () => {
        throw new Error("log range rejected");
      },
      readContract: async () => 99n,
    });

    expect(await resolve({ safeNonce: 7 })).toMatchObject({ state: "pending" });
  });

  it("stays pending when the backlog exceeds the per-probe chunk budget", async () => {
    const span = SAFE_LOG_SCAN_CHUNK_BLOCKS * BigInt(SAFE_LOG_SCAN_MAX_CHUNKS + 5);
    const getLogs = vi.fn(async () => []);
    useClient({
      getTransactionReceipt: notFound,
      getBlockNumber: async () => span,
      getLogs,
      readContract: async () => 99n,
    });

    const probe = await resolve({ fromBlock: 0n, safeNonce: 7 });
    expect(probe.state).toBe("pending");
    expect(getLogs).toHaveBeenCalledTimes(SAFE_LOG_SCAN_MAX_CHUNKS);
    expect(probe.scannedToBlock).toBe(
      SAFE_LOG_SCAN_CHUNK_BLOCKS * BigInt(SAFE_LOG_SCAN_MAX_CHUNKS) - 1n,
    );
  });

  it("keeps scanning across chunks until the match appears", async () => {
    const getLogs = vi.fn(async (args: { fromBlock: bigint; toBlock: bigint }) =>
      args.fromBlock === 0n ? [] : [indexedLog(SAFE_TX_HASH)],
    );
    useClient({
      getTransactionReceipt: notFound,
      getBlockNumber: async () => SAFE_LOG_SCAN_CHUNK_BLOCKS + 10n,
      getLogs,
    });

    expect(await resolve({ fromBlock: 0n })).toMatchObject({
      state: "executed",
      txHash: ON_CHAIN_HASH,
    });
    expect(getLogs).toHaveBeenCalledTimes(2);
  });
});
