/**
 * Types for the EVM Safe multisig integration.
 *
 * Two shapes are supported: the Safe App (our page runs inside the Safe{Wallet}
 * iframe) and WalletConnect (Safe{Wallet} is the WalletConnect peer). In both the
 * connected account is the Safe itself, so payer / refundTo / balance owner need
 * no remapping.
 */

import type { Address } from "viem";

export type SafeMode = "app" | "walletconnect";

export interface SafeAccountInfo {
  safeAddress: Address;
  chainId: number;
  /** Signatures required to execute a transaction. */
  threshold: number;
  owners: Address[];
  /** Next transaction nonce. */
  nonce: number;
  /** Contract version string, e.g. "1.3.0" or "1.4.1". */
  version: string;
}

/** One call inside a Safe proposal. Several of them become a MultiSend. */
export interface SafeMetaTx {
  to: Address;
  data: `0x${string}`;
  value: bigint;
}

/** What a Safe acknowledged after a proposal. */
export interface SafeSendResult {
  hash: string;
  safeAddress: Address;
  chainId: number;
}
