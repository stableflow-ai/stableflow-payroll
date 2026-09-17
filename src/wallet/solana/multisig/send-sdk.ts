/**
 * Propose a Squads vault transaction from a member wallet via the v4 SDK.
 * Confirms only the outer create+proposal transaction.
 */

import * as squads from "@sqds/multisig";
import {
  PublicKey,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { getSolanaConnection } from "@/lib/rpc/solana";
import { pendingSquadsMultisigBroadcast, type BroadcastResult } from "../../types";
import { getSolanaSigner, getSquadsSdkBinding } from "../session";
import { broadcastSolanaTransaction } from "../transfer";
import { SQUADS_SDK_NO_INITIATE_MESSAGE, SQUADS_SDK_NOT_MEMBER_MESSAGE } from "./config";
import { verifySquadsBinding, withTransactionIndexRetry } from "./resolve";

function nextTransactionIndex(current: bigint | number | { toString(): string }): bigint {
  return BigInt(current.toString()) + 1n;
}

export async function sendViaSquadsSdk(
  inner: VersionedTransaction,
): Promise<BroadcastResult> {
  const signer = getSolanaSigner();
  const binding = getSquadsSdkBinding();
  if (!signer) throw new Error("Connect a Solana wallet to send this payout");
  if (!binding || binding.member !== signer.publicKey.toBase58()) {
    throw new Error(SQUADS_SDK_NOT_MEMBER_MESSAGE);
  }
  const info = await verifySquadsBinding(binding);
  if (!info.canInitiate) throw new Error(SQUADS_SDK_NO_INITIATE_MESSAGE);

  const connection = getSolanaConnection();
  const vault = new PublicKey(binding.vaultAddress);
  const multisigPda = new PublicKey(binding.multisigPda);
  const innerMessage = TransactionMessage.decompile(inner.message);
  const deposit = new TransactionMessage({
    payerKey: vault,
    recentBlockhash: innerMessage.recentBlockhash,
    instructions: innerMessage.instructions,
  });

  const transactionIndex = await withTransactionIndexRetry({
    readIndex: async () => {
      const account = await squads.accounts.Multisig.fromAccountAddress(connection, multisigPda);
      return nextTransactionIndex(account.transactionIndex);
    },
    send: async (index) => {
      const createIx = squads.instructions.vaultTransactionCreate({
        multisigPda,
        transactionIndex: index,
        creator: signer.publicKey,
        vaultIndex: binding.vaultIndex,
        ephemeralSigners: 0,
        transactionMessage: deposit,
      });
      const proposalIx = squads.instructions.proposalCreate({
        multisigPda,
        creator: signer.publicKey,
        transactionIndex: index,
      });
      const outer = new Transaction().add(createIx, proposalIx);
      outer.feePayer = signer.publicKey;
      await broadcastSolanaTransaction(outer);
    },
  });

  return pendingSquadsMultisigBroadcast({
    vaultAddress: binding.vaultAddress,
    multisigPda: binding.multisigPda,
    transactionIndex,
  });
}
