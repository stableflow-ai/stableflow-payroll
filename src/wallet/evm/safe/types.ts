/**
 * Types for the EVM Safe multisig integration.
 *
 * Two shapes are supported: the Safe App (our page runs inside the Safe{Wallet}
 * iframe) and WalletConnect (Safe{Wallet} is the WalletConnect peer). In both the
 * connected account is the Safe itself, so payer / refundTo / balance owner need
 * no remapping.
 */

import type { Address, Hash, Hex } from "viem";

export type SafeMode = "app" | "walletconnect";

export interface SafeAccountInfo {
  safeAddress: Address;
  chainId: number;
  /** Signatures required to execute a transaction. */
  threshold: number;
  owners: Address[];
  /** Next transaction nonce. Read fresh before every proposal. */
  nonce: number;
  /** Contract version string, e.g. "1.3.0" or "1.4.1". */
  version: string;
}

/**
 * Outcome of probing a submission the wallet acknowledged.
 *
 * - `executed` / `failed` carry the real on-chain transaction hash.
 * - `cancelled` means the proposal was replaced by another transaction on the
 *   same nonce, which is how a rejection is implemented in Safe.
 * - `pending` means the proposal is confirmed to still be waiting for signatures.
 * - `unknown` means the probe itself could not complete; the caller must retry
 *   and must not draw any conclusion.
 */
export type SafeSubmissionState = "executed" | "failed" | "cancelled" | "pending" | "unknown";

export interface SafeSubmissionProbe {
  state: SafeSubmissionState;
  /** Real on-chain hash. Only set for `executed` and `failed`. */
  txHash: Hash | null;
  /**
   * Highest block the log scan fully covered. `null` when the scan did not
   * complete, in which case it must not be used to advance a stored cursor.
   */
  scannedToBlock: bigint | null;
  /** Why the probe returned `unknown`. */
  reason: string | null;
}

/** One call inside a Safe proposal. Several of them become a MultiSend. */
export interface SafeMetaTx {
  to: Address;
  data: Hex;
  value: bigint;
}

/**
 * What a Safe acknowledged after a proposal.
 *
 * Everything the pending poller needs to resolve `hash` later is captured here at
 * submission time, because `fromBlock` and `nonce` are only meaningful relative to
 * the moment the proposal was made.
 */
export interface SafeSendResult {
  /** Ambiguous: a real transaction hash for an immediate execution, else a `safeTxHash`. */
  hash: Hex;
  safeAddress: Address;
  chainId: number;
  threshold: number;
  safeNonce: number;
  fromBlock: bigint;
}

/** A decoded `ExecutionSuccess` / `ExecutionFailure` log. */
export interface SafeExecutionLogMatch {
  /** The Safe transaction hash the log refers to. */
  safeTxHash: Hex;
  success: boolean;
  /** The enclosing on-chain transaction hash. */
  txHash: Hash;
}
