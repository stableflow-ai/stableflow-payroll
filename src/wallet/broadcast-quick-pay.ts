import type { Address, Hash, Hex } from "viem";
import { getWalletClient, switchChain, waitForTransactionReceipt } from "wagmi/actions";
import { wagmiConfig } from "./evm/config";

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
}): Promise<Hash> {
  await switchChain(wagmiConfig, { chainId: input.chainId as SupportedEvmChainId });
  const client = await getWalletClient(wagmiConfig);
  if (!client) throw new Error("Connect an EVM wallet to broadcast this payout");
  return client.sendTransaction({
    to: input.contract as Address,
    data: toHexData(input.callData),
    value: 0n,
    chain: client.chain,
  });
}

export async function broadcastBatchPayCallData(input: {
  chainId: number;
  tokenAddress: string;
  approvals: string[];
  callData: string;
  contract: string;
}): Promise<Hash> {
  const chainId = input.chainId as SupportedEvmChainId;
  for (const approval of input.approvals) {
    if (!approval.trim()) continue;
    const hash = await broadcastQuickPayCallData({
      chainId: input.chainId,
      contract: input.tokenAddress,
      callData: approval,
    });
    await waitForTransactionReceipt(wagmiConfig, { hash, chainId });
  }
  return broadcastQuickPayCallData({
    chainId: input.chainId,
    contract: input.contract,
    callData: input.callData,
  });
}
