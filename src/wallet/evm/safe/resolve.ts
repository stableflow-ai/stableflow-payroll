/**
 * Turn the hash a Safe hands back into a real on-chain transaction hash.
 *
 * `eth_sendTransaction` through the Safe App provider always returns a
 * `safeTxHash`, while Safe's WalletConnect integration returns a real transaction
 * hash when a 1-of-X Safe executes immediately. The two are indistinguishable by
 * shape, so both readings are probed: first a receipt lookup, then a scan of the
 * Safe's own execution events keyed by `safeTxHash`.
 */

import type { Address, Hash, Hex, PublicClient } from "viem";
import { getPublicClientForChainId } from "../balance";
import {
  EXECUTION_FAILURE_TOPIC,
  EXECUTION_SUCCESS_TOPIC,
  safeExecutionEventsAbi,
} from "./abi";
import {
  SAFE_LOG_SCAN_CHUNK_BLOCKS,
  SAFE_LOG_SCAN_MAX_CHUNKS,
  SAFE_UNSUPPORTED_CHAIN_MESSAGE,
} from "./config";
import { getSafeNonce } from "./info";
import type { SafeExecutionLogMatch, SafeSubmissionProbe } from "./types";

function sameHash(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

function firstWord(data: string): Hex | null {
  if (!data.startsWith("0x") || data.length < 66) return null;
  return `0x${data.slice(2, 66)}` as Hex;
}

/**
 * Decode one `ExecutionSuccess` / `ExecutionFailure` log, or `null` when the log is
 * something else.
 *
 * Safe 1.3.0 emits `txHash` as the first word of `data`; 1.4.1+ indexes it into
 * `topics[1]`. Both keep the same signature and therefore the same topic0, so the
 * layout has to be picked from the topic count rather than a version lookup.
 */
export function decodeSafeExecutionLog(log: {
  topics: readonly string[];
  data: string;
  transactionHash: string | null;
}): SafeExecutionLogMatch | null {
  const topic = log.topics[0];
  if (!topic) return null;

  const success = sameHash(topic, EXECUTION_SUCCESS_TOPIC);
  const failure = sameHash(topic, EXECUTION_FAILURE_TOPIC);
  if (!success && !failure) return null;
  if (!log.transactionHash) return null;

  const safeTxHash = log.topics.length > 1 ? log.topics[1] : firstWord(log.data);
  if (!safeTxHash) return null;

  return {
    safeTxHash: safeTxHash as Hex,
    success,
    txHash: log.transactionHash as Hash,
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Failed to probe Safe transaction";
}

function unknownProbe(reason: string): SafeSubmissionProbe {
  return { state: "unknown", txHash: null, scannedToBlock: null, reason };
}

/**
 * Treat `hash` as a real transaction hash. Returns `null` when no receipt exists,
 * which means the caller should fall through to the event scan.
 */
async function probeReceipt(
  client: PublicClient,
  hash: Hex,
  safeAddress: Address,
): Promise<SafeSubmissionProbe | null> {
  let receipt;
  try {
    receipt = await client.getTransactionReceipt({ hash });
  } catch {
    return null;
  }

  if (receipt.status !== "success") {
    return { state: "failed", txHash: receipt.transactionHash, scannedToBlock: null, reason: null };
  }

  // `execTransaction` can succeed at the EVM level while the inner Safe
  // transaction reverts, so the event outranks the receipt status.
  for (const log of receipt.logs) {
    if (!sameHash(log.address, safeAddress)) continue;
    const decoded = decodeSafeExecutionLog(log);
    if (!decoded) continue;
    return {
      state: decoded.success ? "executed" : "failed",
      txHash: receipt.transactionHash,
      scannedToBlock: null,
      reason: null,
    };
  }

  return { state: "executed", txHash: receipt.transactionHash, scannedToBlock: null, reason: null };
}

interface ScanOutcome {
  match: SafeExecutionLogMatch | null;
  /** Highest block fully covered, or `null` when nothing was covered. */
  scannedToBlock: bigint | null;
  /** Whether the scan reached `toBlock`. Cancellation may only be inferred when true. */
  complete: boolean;
}

/** Walk the Safe's execution events in bounded chunks looking for `safeTxHash`. */
async function scanExecutionLogs(
  client: PublicClient,
  opts: { safeAddress: Address; safeTxHash: Hex; fromBlock: bigint; toBlock: bigint },
): Promise<ScanOutcome> {
  if (opts.fromBlock > opts.toBlock) {
    return { match: null, scannedToBlock: opts.toBlock, complete: true };
  }

  let cursor = opts.fromBlock;
  let scannedToBlock: bigint | null = null;

  for (let chunk = 0; chunk < SAFE_LOG_SCAN_MAX_CHUNKS; chunk++) {
    let toBlock = cursor + SAFE_LOG_SCAN_CHUNK_BLOCKS - 1n;
    if (toBlock > opts.toBlock) toBlock = opts.toBlock;

    let logs;
    try {
      logs = await client.getLogs({
        address: opts.safeAddress,
        events: safeExecutionEventsAbi,
        fromBlock: cursor,
        toBlock,
        strict: false,
      });
    } catch {
      return { match: null, scannedToBlock, complete: false };
    }

    for (const log of logs) {
      const decoded = decodeSafeExecutionLog(log);
      if (decoded && sameHash(decoded.safeTxHash, opts.safeTxHash)) {
        return { match: decoded, scannedToBlock: toBlock, complete: true };
      }
    }

    scannedToBlock = toBlock;
    if (toBlock >= opts.toBlock) return { match: null, scannedToBlock, complete: true };
    cursor = toBlock + 1n;
  }

  return { match: null, scannedToBlock, complete: false };
}

/**
 * Resolve what happened to a submission the wallet acknowledged.
 *
 * `cancelled` is only ever returned when the event scan reached the head block and
 * the nonce read at that same block has moved past `safeNonce`. Both observations
 * come from one block so they cannot disagree, and any incomplete scan degrades to
 * `pending`. A false `cancelled` would tell the user a payout never happened, so
 * the bias is deliberate.
 */
export async function resolveSafeSubmission(input: {
  chainId: number;
  safeAddress: Address;
  /** Ambiguous hash returned by the wallet: real transaction hash or `safeTxHash`. */
  hash: Hex;
  /** Block height captured when the proposal was submitted. */
  fromBlock: bigint;
  /** Safe nonce captured when the proposal was submitted. */
  safeNonce: number;
}): Promise<SafeSubmissionProbe> {
  const client = getPublicClientForChainId(input.chainId);
  if (!client) return unknownProbe(`${SAFE_UNSUPPORTED_CHAIN_MESSAGE}: ${input.chainId}`);

  const direct = await probeReceipt(client, input.hash, input.safeAddress);
  if (direct) return direct;

  let head: bigint;
  try {
    head = await client.getBlockNumber();
  } catch (error) {
    return unknownProbe(errorMessage(error));
  }

  const scan = await scanExecutionLogs(client, {
    safeAddress: input.safeAddress,
    safeTxHash: input.hash,
    fromBlock: input.fromBlock,
    toBlock: head,
  });

  if (scan.match) {
    return {
      state: scan.match.success ? "executed" : "failed",
      txHash: scan.match.txHash,
      scannedToBlock: scan.scannedToBlock,
      reason: null,
    };
  }

  const stillPending: SafeSubmissionProbe = {
    state: "pending",
    txHash: null,
    scannedToBlock: scan.scannedToBlock,
    reason: null,
  };
  if (!scan.complete) return stillPending;

  let nonceAtHead: number;
  try {
    nonceAtHead = await getSafeNonce({
      chainId: input.chainId,
      address: input.safeAddress,
      blockNumber: head,
    });
  } catch {
    return stillPending;
  }

  if (nonceAtHead > input.safeNonce) {
    return { state: "cancelled", txHash: null, scannedToBlock: scan.scannedToBlock, reason: null };
  }
  return stillPending;
}
