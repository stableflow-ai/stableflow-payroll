/**
 * Broadcast a batch swap transaction on the origin chain.
 */

import type { PayBatchSwapTransaction } from "@/types/payout";
import { isNativeToken, type IntentsToken } from "@/stores/intents-tokens";
import { broadcastBatchPayCallData } from "./broadcast-quick-pay";
import { broadcastNearActions } from "./near/transfer";
import { broadcastSerializedSolanaTx } from "./solana/transfer";
import { broadcastTronCallData, waitForTronSuccess } from "./tron/transfer";

export async function broadcastBatchPayout(input: {
  token: IntentsToken;
  transaction: PayBatchSwapTransaction;
  amountIn: bigint;
  payer: string;
}): Promise<string> {
  const kind = input.token.chain.chainKind;
  if (kind === "evm") return broadcastEvm(input);
  if (kind === "tron") return broadcastTron(input);
  if (kind === "near") return broadcastNear(input);
  if (kind === "solana") return broadcastSolana(input);
  throw new Error("Unsupported batch origin chain");
}

async function broadcastEvm(input: {
  token: IntentsToken;
  transaction: PayBatchSwapTransaction;
  amountIn: bigint;
  payer: string;
}): Promise<string> {
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
    requiredAmount: input.amountIn,
    network: input.token.blockchain,
    value: native ? input.amountIn : 0n,
    verifyAllowance: !native,
  });
}

async function broadcastTron(input: {
  token: IntentsToken;
  transaction: PayBatchSwapTransaction;
  amountIn: bigint;
}): Promise<string> {
  const tx = input.transaction;
  if (!tx.batch_contract?.trim() || !tx.callData?.trim()) {
    throw new Error("Missing batch transaction");
  }
  const native = isNativeToken(input.token);
  for (const approval of tx.approvals ?? []) {
    if (!approval.trim()) continue;
    const tokenAddress = input.token.contractAddress?.trim();
    if (!tokenAddress) throw new Error("Missing origin token contract");
    const hash = await broadcastTronCallData({
      contract: tokenAddress,
      callData: approval,
      callValue: 0n,
    });
    await waitForTronSuccess(hash);
  }
  return broadcastTronCallData({
    contract: tx.batch_contract,
    callData: tx.callData,
    callValue: native ? input.amountIn : 0n,
  });
}

async function broadcastNear(input: {
  transaction: PayBatchSwapTransaction;
}): Promise<string> {
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
  transaction: PayBatchSwapTransaction;
}): Promise<string> {
  const serialized = input.transaction.serializedTransaction?.trim();
  if (!serialized) throw new Error("Missing batch transaction");
  return broadcastSerializedSolanaTx({
    serializedTransaction: serialized,
  });
}
