/**
 * Broadcast a batch swap transaction on the origin chain.
 *
 * EVM Safe, NEAR SputnikDAO / Trezu, Solana SquadsX, and Squads SDK
 * proposals can return `pending-multisig`. Other wallets resolve to an
 * executed transaction hash.
 */

import type { PayBatchSwapTransaction } from "@/types/payout";
import { isNativeToken, type IntentsToken } from "@/stores/intents-tokens";
import { broadcastBatchPayCallData } from "./broadcast-quick-pay";
import { INSUFFICIENT_APPROVAL_AMOUNT_MESSAGE } from "./config";
import { executedBroadcast, type BroadcastResult } from "./types";
import { broadcastNearActions } from "./near/transfer";
import { buildSolanaDepositTx } from "./solana/build-deposit-tx";
import { SOLANA_MISSING_OUTPUTS_MESSAGE } from "./solana/config";
import { activeSquadsMode, sendViaSquads, sendViaSquadsSdk, solanaBroadcastResult } from "./solana/multisig";
import { broadcastSolanaTransaction } from "./solana/transfer";
import { readTrc20Allowance } from "./tron/balance";
import { TRON_CONFIRM_TIMEOUT_MESSAGE } from "./tron/config";
import { broadcastTronCallData, isTronConfirmTimeout, waitForTronSuccess } from "./tron/transfer";
import { transferNativeZec } from "./zec/transfer";
import { verifyPostApproveAllowance } from "./verify-post-approve-allowance";

export async function broadcastBatchPayout(input: {
  token: IntentsToken;
  transaction: PayBatchSwapTransaction;
  amountIn: bigint;
  /** ERC-20 allowance that must remain after this batch's approvals. Defaults to `amountIn`. */
  requiredAmount?: bigint;
  payer: string;
}): Promise<BroadcastResult> {
  const kind = input.token.chain.chainKind;
  if (kind === "evm") return broadcastEvm(input);
  if (kind === "tron") return broadcastTron(input);
  if (kind === "near") return broadcastNear(input);
  if (kind === "solana") return broadcastSolana(input);
  if (kind === "zec") return broadcastZec(input);
  throw new Error("Unsupported batch origin chain");
}

async function broadcastEvm(input: {
  token: IntentsToken;
  transaction: PayBatchSwapTransaction;
  amountIn: bigint;
  requiredAmount?: bigint;
  payer: string;
}): Promise<BroadcastResult> {
  const tx = input.transaction;
  const chainId = input.token.chain.chainId;
  if (!chainId) throw new Error("Missing EVM chain id");
  if (!tx.batch_contract?.trim() || !tx.callData?.trim()) {
    throw new Error("Missing batch transaction");
  }
  const native = isNativeToken(input.token);
  return broadcastBatchPayCallData({
    chainId,
    tokenAddress: input.token.contractAddress ?? "",
    approvals: tx.approvals ?? [],
    callData: tx.callData,
    contract: tx.batch_contract,
    owner: input.payer,
    spender: tx.batch_contract,
    requiredAmount: input.requiredAmount ?? input.amountIn,
    network: input.token.blockchain,
    value: native ? input.amountIn : 0n,
    verifyAllowance: !native,
  });
}

async function broadcastTron(input: {
  token: IntentsToken;
  transaction: PayBatchSwapTransaction;
  amountIn: bigint;
  requiredAmount?: bigint;
  payer: string;
}): Promise<BroadcastResult> {
  const tx = input.transaction;
  if (!tx.batch_contract?.trim() || !tx.callData?.trim()) {
    throw new Error("Missing batch transaction");
  }
  const native = isNativeToken(input.token);
  let confirmTimedOut = false;
  for (const approval of tx.approvals ?? []) {
    if (!approval.trim()) continue;
    const tokenAddress = input.token.contractAddress?.trim();
    if (!tokenAddress) throw new Error("Missing origin token contract");
    const hash = await broadcastTronCallData({
      contract: tokenAddress,
      callData: approval,
      callValue: 0n,
    });
    try {
      await waitForTronSuccess(hash);
    } catch (error) {
      if (!isTronConfirmTimeout(error)) throw error;
      confirmTimedOut = true;
    }
  }
  if (!native) {
    const tokenAddress = input.token.contractAddress?.trim();
    if (!tokenAddress) throw new Error("Missing origin token contract");
    try {
      await verifyPostApproveAllowance({
        requiredAmount: input.requiredAmount ?? input.amountIn,
        readAllowance: () => readTrc20Allowance({
          tokenContract: tokenAddress,
          owner: input.payer,
          spender: tx.batch_contract,
        }),
      });
    } catch (error) {
      if (
        confirmTimedOut
        && !(error instanceof Error && error.message === INSUFFICIENT_APPROVAL_AMOUNT_MESSAGE)
      ) {
        throw new Error(TRON_CONFIRM_TIMEOUT_MESSAGE);
      }
      throw error;
    }
  } else if (confirmTimedOut) {
    throw new Error(TRON_CONFIRM_TIMEOUT_MESSAGE);
  }
  return executedBroadcast(await broadcastTronCallData({
    contract: tx.batch_contract,
    callData: tx.callData,
    callValue: native ? input.amountIn : 0n,
  }));
}

async function broadcastNear(input: {
  transaction: PayBatchSwapTransaction;
}): Promise<BroadcastResult> {
  const tx = input.transaction;
  const receiverId = tx.receiverId?.trim();
  if (!receiverId || !tx.actions?.length) {
    throw new Error("Missing batch transaction");
  }
  return broadcastNearActions({
    receiverId,
    actions: tx.actions,
  });
}

async function broadcastSolana(input: {
  token: IntentsToken;
  transaction: PayBatchSwapTransaction;
  amountIn: bigint;
  payer: string;
}): Promise<BroadcastResult> {
  const outputs = input.transaction.outputs ?? [];
  if (!outputs.length) throw new Error(SOLANA_MISSING_OUTPUTS_MESSAGE);
  const native = isNativeToken(input.token);
  const unsigned = await buildSolanaDepositTx({
    payer: input.payer,
    mint: native ? null : input.token.contractAddress,
    outputs,
    totalSourceAmountRaw: input.amountIn,
  });
  if (activeSquadsMode() === "squadsx") return sendViaSquads(unsigned);
  if (activeSquadsMode() === "sdk") return sendViaSquadsSdk(unsigned);
  const { signature, signed } = await broadcastSolanaTransaction(unsigned);
  return solanaBroadcastResult({
    signature,
    signed,
    vaultAddress: input.payer,
    squadsMode: null,
  });
}

async function broadcastZec(input: {
  token: IntentsToken;
  transaction: PayBatchSwapTransaction;
}): Promise<BroadcastResult> {
  const outputs = input.transaction.outputs ?? [];
  if (outputs.length !== 1) {
    throw new Error("Zcash does not support batch payments yet");
  }
  const output = outputs[0];
  const amountRaw = output.amountRaw.trim();
  if (!amountRaw) throw new Error("Missing Zcash output amount");
  return executedBroadcast(await transferNativeZec({
    to: output.address,
    amountIn: BigInt(amountRaw),
    decimals: input.token.decimals,
  }));
}
