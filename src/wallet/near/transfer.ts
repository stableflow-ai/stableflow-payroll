/**
 * Near native and FT transfers to a deposit address.
 */

import type { ConnectorAction, NearWalletBase } from "@hot-labs/near-connect";
import { nearViewFunction } from "@/lib/rpc/near";
import type { PayBatchNearAction } from "@/types/payout";
import {
  executedBroadcast,
  pendingNearMultisigBroadcast,
  type BroadcastResult,
} from "../types";
import { TREZU_NOT_CONNECTED_MESSAGE } from "./multisig/config";
import { activeNearMultisigMode } from "./multisig/detect";
import {
  discoverProposal,
  matchSpecFromActions,
  snapshotLastProposalId,
} from "./multisig/proposal";
import { getNearConnector } from "./session";

const FT_GAS = BigInt("30000000000000");
const STORAGE_GAS = BigInt("30000000000000");
const STORAGE_DEPOSIT = BigInt("1250000000000000000000");

function requireConnector() {
  const connector = getNearConnector();
  if (!connector) throw new Error(TREZU_NOT_CONNECTED_MESSAGE);
  return connector;
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

function functionCall(
  methodName: string,
  args: object,
  gas: bigint,
  deposit: bigint,
): ConnectorAction {
  return {
    type: "FunctionCall",
    params: {
      methodName,
      args,
      gas: gas.toString(),
      deposit: deposit.toString(),
    },
  };
}

function nativeTransfer(deposit: bigint): ConnectorAction {
  return {
    type: "Transfer",
    params: { deposit: deposit.toString() },
  };
}

function toConnectorAction(action: PayBatchNearAction): ConnectorAction {
  return {
    type: "FunctionCall",
    params: {
      methodName: action.params.methodName,
      args: action.params.args,
      gas: action.params.gas,
      deposit: action.params.deposit,
    },
  };
}

type NearTx = {
  receiverId: string;
  actions: ConnectorAction[];
};

async function broadcastNearViaMultisig(
  wallet: NearWalletBase,
  input: { receiverId: string; actions: PayBatchNearAction[] },
): Promise<BroadcastResult> {
  const daoId = (await wallet.getAccounts())[0]?.accountId?.trim();
  if (!daoId) throw new Error(TREZU_NOT_CONNECTED_MESSAGE);

  const fromIndex = await snapshotLastProposalId(daoId);
  const expected = matchSpecFromActions({
    receiverId: input.receiverId,
    actions: input.actions,
  });

  let discovered = false;
  const submitted = wallet.signAndSendTransaction({
    receiverId: input.receiverId,
    actions: input.actions.map(toConnectorAction),
  });
  const earlyFail = new Promise<never>((_, reject) => {
    void submitted.then(
      () => undefined,
      (error) => {
        if (!discovered) {
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      },
    );
  });

  try {
    const proposalId = await Promise.race([
      discoverProposal({ daoId, fromIndex, expected }),
      earlyFail,
    ]);
    discovered = true;
    return pendingNearMultisigBroadcast({ proposalId, daoId });
  } catch (error) {
    discovered = true;
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export async function broadcastNearActions(input: {
  receiverId: string;
  actions: PayBatchNearAction[];
}): Promise<BroadcastResult> {
  const wallet = await requireConnector().wallet();
  if (await activeNearMultisigMode()) {
    return broadcastNearViaMultisig(wallet, input);
  }
  const result = await wallet.signAndSendTransaction({
    receiverId: input.receiverId,
    actions: input.actions.map(toConnectorAction),
  });
  return executedBroadcast(await hashFromOutcomes(result));
}

export async function transferNativeNear(input: {
  to: string;
  amountIn: bigint;
}): Promise<string> {
  const wallet = await requireConnector().wallet();
  const result = await wallet.signAndSendTransaction({
    receiverId: input.to,
    actions: [nativeTransfer(input.amountIn)],
  });
  return hashFromOutcomes(result);
}

async function needsStorageDeposit(tokenContract: string, accountId: string): Promise<boolean> {
  const storage = await nearViewFunction<{ available?: string } | null>(
    tokenContract,
    "storage_balance_of",
    { account_id: accountId },
  );
  return !storage?.available;
}

function storageDepositTx(tokenContract: string, accountId: string): NearTx {
  return {
    receiverId: tokenContract,
    actions: [
      functionCall(
        "storage_deposit",
        { account_id: accountId, registration_only: true },
        STORAGE_GAS,
        STORAGE_DEPOSIT,
      ),
    ],
  };
}

export async function transferFt(input: {
  tokenContract: string;
  to: string;
  amountIn: bigint;
}): Promise<string> {
  const wallet = await requireConnector().wallet();
  const transactions: NearTx[] = [];

  if (await needsStorageDeposit(input.tokenContract, input.to)) {
    transactions.push(storageDepositTx(input.tokenContract, input.to));
  }

  transactions.push({
    receiverId: input.tokenContract,
    actions: [
      functionCall(
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

export async function transferNearViaWrap(input: {
  tokenContract: string;
  to: string;
  amountIn: bigint;
}): Promise<string> {
  const wallet = await requireConnector().wallet();
  const payer = (await wallet.getAccounts())[0]?.accountId;
  if (!payer) throw new Error("Connect a Near wallet to send this payout");

  const transactions: NearTx[] = [];
  if (await needsStorageDeposit(input.tokenContract, payer)) {
    transactions.push(storageDepositTx(input.tokenContract, payer));
  }
  if (payer !== input.to && await needsStorageDeposit(input.tokenContract, input.to)) {
    transactions.push(storageDepositTx(input.tokenContract, input.to));
  }
  transactions.push({
    receiverId: input.tokenContract,
    actions: [functionCall("near_deposit", {}, FT_GAS, input.amountIn)],
  });
  transactions.push({
    receiverId: input.tokenContract,
    actions: [
      functionCall(
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
