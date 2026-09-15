import type { Address, Hash, Hex } from "viem";
import { getWalletClient, switchChain, waitForTransactionReceipt } from "wagmi/actions";
import { readErc20Allowance } from "./evm/balance";
import { wagmiConfig } from "./evm/config";
import {
  SafeAtomicUnsupportedError,
  SafeApprovalProposedError,
  activeSafeMode,
  buildSafeBundle,
  sendViaSafe,
} from "./evm/safe";
import { pendingMultisigBroadcast, type BroadcastResult } from "./types";
import { verifyPostApproveAllowance } from "./verify-post-approve-allowance";

type SupportedEvmChainId = (typeof wagmiConfig)["chains"][number]["id"];

function toHexData(callData: string): Hex {
  const trimmed = callData.trim();
  if (!trimmed) throw new Error("Missing call data");
  if (trimmed.startsWith("0x") || trimmed.startsWith("0X")) return trimmed as Hex;
  return `0x${trimmed}` as Hex;
}

export async function broadcastQuickPayCallData(input: {
  chainId: number;
  contract: string;
  callData: string;
  value?: bigint;
}): Promise<Hash> {
  await switchChain(wagmiConfig, { chainId: input.chainId as SupportedEvmChainId });
  const client = await getWalletClient(wagmiConfig);
  if (!client) throw new Error("Connect an EVM wallet to broadcast this payout");
  return client.sendTransaction({
    to: input.contract as Address,
    data: toHexData(input.callData),
    value: input.value ?? 0n,
    chain: client.chain,
  });
}

interface BatchPayCallDataInput {
  chainId: number;
  tokenAddress: string;
  approvals: string[];
  callData: string;
  contract: string;
  owner: string;
  spender: string;
  requiredAmount: bigint;
  network: string;
  value?: bigint;
  verifyAllowance?: boolean;
}

/**
 * One Safe proposal carrying the approvals and the batch call.
 *
 * MultiSend makes the bundle atomic, so the EOA path's approve → wait for receipt →
 * re-read allowance sequence has nothing left to guard against and is skipped.
 */
async function broadcastBatchViaSafe(input: BatchPayCallDataInput): Promise<BroadcastResult> {
  const bundle = buildSafeBundle({
    approvals: input.approvals,
    tokenAddress: input.tokenAddress,
    contract: input.contract,
    callData: input.callData,
    value: input.value,
  });

  try {
    return pendingMultisigBroadcast(await sendViaSafe({ chainId: input.chainId, txs: bundle }));
  } catch (error) {
    if (!(error instanceof SafeAtomicUnsupportedError)) throw error;
  }

  // No atomic batching over this connection. An allowance that already covers the
  // payout makes the approval unnecessary, which is the common case after the
  // first payment from this Safe.
  const allowance = await readErc20Allowance({
    network: input.network,
    tokenAddress: input.tokenAddress as Address,
    owner: input.owner as Address,
    spender: input.spender as Address,
  });
  if (allowance >= input.requiredAmount) {
    const payoutOnly = buildSafeBundle({
      contract: input.contract,
      callData: input.callData,
      value: input.value,
    });
    return pendingMultisigBroadcast(await sendViaSafe({ chainId: input.chainId, txs: payoutOnly }));
  }

  // Propose each approval on its own so the owners can sign them now. One proposal
  // per call keeps this off the 5792 path; Safe queues them on consecutive nonces.
  // The payout still needs a fresh quote afterwards, because waiting for signatures
  // inline would outlive the quote anyway.
  for (const approval of input.approvals) {
    if (!approval.trim()) continue;
    await sendViaSafe({
      chainId: input.chainId,
      txs: [{ to: input.tokenAddress as Address, data: toHexData(approval), value: 0n }],
    });
  }
  throw new SafeApprovalProposedError();
}

export async function broadcastBatchPayCallData(
  input: BatchPayCallDataInput,
): Promise<BroadcastResult> {
  if (await activeSafeMode()) return broadcastBatchViaSafe(input);

  const chainId = input.chainId as SupportedEvmChainId;
  const verifyAllowance = input.verifyAllowance !== false;
  let approveBlockNumber: bigint | undefined;
  for (const approval of input.approvals) {
    if (!approval.trim()) continue;
    const hash = await broadcastQuickPayCallData({
      chainId: input.chainId,
      contract: input.tokenAddress,
      callData: approval,
    });
    const receipt = await waitForTransactionReceipt(wagmiConfig, { hash, chainId });
    if (receipt.status !== "success") {
      throw new Error("Token approval failed");
    }
    approveBlockNumber = receipt.blockNumber;
  }
  if (verifyAllowance) {
    await verifyPostApproveAllowance({
      requiredAmount: input.requiredAmount,
      readAllowance: () => readErc20Allowance({
        network: input.network,
        tokenAddress: input.tokenAddress as Address,
        owner: input.owner as Address,
        spender: input.spender as Address,
        blockNumber: approveBlockNumber,
      }),
    });
  }
  return {
    kind: "executed",
    txHash: await broadcastQuickPayCallData({
      chainId: input.chainId,
      contract: input.contract,
      callData: input.callData,
      value: input.value,
    }),
  };
}
