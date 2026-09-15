/**
 * Propose a bundle to the connected Safe.
 *
 * Both supported shapes end at the same place — a Safe proposal identified by a
 * `safeTxHash` — but they get there differently. In the Safe App the iframe SDK
 * takes the whole list and builds the MultiSend. Over WalletConnect a single call
 * rides a plain `eth_sendTransaction`, while several calls need EIP-5792
 * `wallet_sendCalls`, which Safe only advertises on some chains.
 *
 * A Safe is bound to one chain and cannot be switched, so `switchChain` is never
 * called here: the origin chain either matches the connected Safe or the caller
 * gets `SafeChainMismatchError`.
 */

import SafeAppsSDK from "@safe-global/safe-apps-sdk";
import type { Hex } from "viem";
import { getCapabilities, getConnections, getWalletClient, sendCalls } from "wagmi/actions";
import { getPublicClientForChainId } from "../balance";
import { wagmiConfig } from "../config";
import {
  SAFE_APPROVAL_PROPOSED_MESSAGE,
  SAFE_CHAIN_MISMATCH_MESSAGE,
  SAFE_CONNECTOR_ID,
  SAFE_MISSING_CALL_DATA_MESSAGE,
  SAFE_NOT_CONNECTED_MESSAGE,
  SAFE_SEND_BLOCK_MARGIN,
  SAFE_TWO_STEP_APPROVAL_MESSAGE,
  SAFE_UNSUPPORTED_CHAIN_MESSAGE,
  SAFE_UNTRACKABLE_SUBMISSION_MESSAGE,
} from "./config";
import { getSafeInfo } from "./info";
import type { SafeMetaTx, SafeMode, SafeSendResult } from "./types";

type SupportedEvmChainId = (typeof wagmiConfig)["chains"][number]["id"];

export class SafeNotConnectedError extends Error {
  constructor() {
    super(SAFE_NOT_CONNECTED_MESSAGE);
    this.name = "SafeNotConnectedError";
  }
}

export class SafeChainMismatchError extends Error {
  readonly safeChainId: number;
  readonly requestedChainId: number;

  constructor(safeChainId: number, requestedChainId: number) {
    super(SAFE_CHAIN_MISMATCH_MESSAGE);
    this.name = "SafeChainMismatchError";
    this.safeChainId = safeChainId;
    this.requestedChainId = requestedChainId;
  }
}

/**
 * The Safe cannot batch over WalletConnect, so an approval plus the payout cannot
 * be one proposal. The caller decides whether to skip the approval (allowance
 * already sufficient) or fall back to two signature rounds.
 */
export class SafeAtomicUnsupportedError extends Error {
  constructor() {
    super(SAFE_TWO_STEP_APPROVAL_MESSAGE);
    this.name = "SafeAtomicUnsupportedError";
  }
}

/**
 * The non-atomic fallback proposed the approval alone. No funds moved, but the
 * payout has to be started again once the approval is executed.
 */
export class SafeApprovalProposedError extends Error {
  constructor() {
    super(SAFE_APPROVAL_PROPOSED_MESSAGE);
    this.name = "SafeApprovalProposedError";
  }
}

/**
 * The proposal went through but the wallet answered with an identifier we cannot
 * resolve against the chain, so the payout has to be confirmed by hand.
 */
export class SafeUntrackableSubmissionError extends Error {
  readonly returnedId: string;

  constructor(returnedId: string) {
    super(SAFE_UNTRACKABLE_SUBMISSION_MESSAGE);
    this.name = "SafeUntrackableSubmissionError";
    this.returnedId = returnedId;
  }
}

let safeAppsSdk: SafeAppsSDK | null = null;

function getSafeAppsSdk(): SafeAppsSDK {
  if (!safeAppsSdk) safeAppsSdk = new SafeAppsSDK();
  return safeAppsSdk;
}

function isHash32(value: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(value);
}

async function supportsAtomicBatch(chainId: SupportedEvmChainId): Promise<boolean> {
  try {
    const capabilities = await getCapabilities(wagmiConfig, { chainId });
    const status = (capabilities as { atomic?: { status?: string } } | undefined)?.atomic?.status;
    return status === "supported" || status === "ready";
  } catch {
    return false;
  }
}

async function sendSingleTx(chainId: SupportedEvmChainId, tx: SafeMetaTx): Promise<string> {
  const client = await getWalletClient(wagmiConfig, { chainId });
  if (!client) throw new SafeNotConnectedError();
  return client.sendTransaction({
    to: tx.to,
    data: tx.data,
    value: tx.value,
    chain: client.chain,
  });
}

async function submit(
  mode: SafeMode,
  chainId: SupportedEvmChainId,
  txs: SafeMetaTx[],
): Promise<string> {
  if (mode === "app") {
    const response = await getSafeAppsSdk().txs.send({
      txs: txs.map((tx) => ({ to: tx.to, value: tx.value.toString(), data: tx.data })),
    });
    return response.safeTxHash;
  }

  if (txs.length === 1) return sendSingleTx(chainId, txs[0]);

  if (!(await supportsAtomicBatch(chainId))) throw new SafeAtomicUnsupportedError();

  const { id } = await sendCalls(wagmiConfig, {
    chainId,
    calls: txs.map((tx) => ({ to: tx.to, data: tx.data, value: tx.value })),
    forceAtomic: true,
  });
  return id;
}

/**
 * Propose `txs` and capture everything needed to resolve the result later.
 *
 * `fromBlock` and `safeNonce` are read *before* proposing: both are only
 * meaningful relative to the moment of submission, and a floor that is slightly
 * too low only costs a few extra blocks of log scanning.
 */
export async function sendViaSafe(input: {
  chainId: number;
  txs: SafeMetaTx[];
}): Promise<SafeSendResult> {
  if (input.txs.length === 0) throw new Error(SAFE_MISSING_CALL_DATA_MESSAGE);

  const [connection] = getConnections(wagmiConfig);
  const safeAddress = connection?.accounts[0];
  if (!connection || !safeAddress) throw new SafeNotConnectedError();
  if (connection.chainId !== input.chainId) {
    throw new SafeChainMismatchError(connection.chainId, input.chainId);
  }

  const chainId = input.chainId as SupportedEvmChainId;
  const client = getPublicClientForChainId(input.chainId);
  if (!client) throw new Error(`${SAFE_UNSUPPORTED_CHAIN_MESSAGE}: ${input.chainId}`);

  const info = await getSafeInfo({ chainId: input.chainId, address: safeAddress });
  const head = await client.getBlockNumber();
  const fromBlock = head > SAFE_SEND_BLOCK_MARGIN ? head - SAFE_SEND_BLOCK_MARGIN : 0n;

  const mode: SafeMode = connection.connector.id === SAFE_CONNECTOR_ID ? "app" : "walletconnect";
  const hash = await submit(mode, chainId, input.txs);
  if (!isHash32(hash)) throw new SafeUntrackableSubmissionError(hash);

  return {
    hash: hash as Hex,
    safeAddress,
    chainId: input.chainId,
    threshold: info.threshold,
    safeNonce: info.nonce,
    fromBlock,
  };
}
