/**
 * Near native and FT transfers to a deposit address.
 */

import { actionCreators } from "@near-wallet-selector/core";
import { nearViewFunction } from "@/lib/rpc/near";
import { getNearSelector } from "./session";

const FT_GAS = BigInt("30000000000000");
const STORAGE_GAS = BigInt("15000000000000");
const STORAGE_DEPOSIT = BigInt("1250000000000000000000");

function requireSelector() {
  const selector = getNearSelector();
  if (!selector) throw new Error("Connect a Near wallet to send this payout");
  return selector;
}

async function hashFromOutcomes(result: unknown): Promise<string> {
  const list = Array.isArray(result) ? result : result ? [result] : [];
  const last = list[list.length - 1] as {
    transaction?: { hash?: string };
    transaction_outcome?: { id?: string };
  } | undefined;
  const hash = last?.transaction?.hash || last?.transaction_outcome?.id;
  if (!hash) throw new Error("Near wallet did not return a transaction hash");
  return hash;
}

export async function transferNativeNear(input: {
  to: string;
  amountIn: bigint;
}): Promise<string> {
  const selector = requireSelector();
  const wallet = await selector.wallet();
  const result = await wallet.signAndSendTransaction({
    receiverId: input.to,
    actions: [actionCreators.transfer(input.amountIn)],
  });
  return hashFromOutcomes(result);
}

export async function transferFt(input: {
  tokenContract: string;
  to: string;
  amountIn: bigint;
}): Promise<string> {
  const selector = requireSelector();
  const wallet = await selector.wallet();
  const transactions: Array<{
    receiverId: string;
    actions: ReturnType<typeof actionCreators.functionCall>[];
  }> = [];

  const storage = await nearViewFunction<{ available?: string } | null>(
    input.tokenContract,
    "storage_balance_of",
    { account_id: input.to },
  );
  if (!storage?.available) {
    transactions.push({
      receiverId: input.tokenContract,
      actions: [
        actionCreators.functionCall(
          "storage_deposit",
          { account_id: input.to, registration_only: true },
          STORAGE_GAS,
          STORAGE_DEPOSIT,
        ),
      ],
    });
  }

  transactions.push({
    receiverId: input.tokenContract,
    actions: [
      actionCreators.functionCall(
        "ft_transfer",
        {
          receiver_id: input.to,
          amount: input.amountIn.toString(),
          memo: null,
        },
        FT_GAS,
        1n,
      ),
    ],
  });

  const result = await wallet.signAndSendTransactions({ transactions });
  return hashFromOutcomes(result);
}
