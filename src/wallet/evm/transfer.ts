/**
 * EVM native gas-token and ERC-20 transfers to a deposit address.
 */

import { encodeFunctionData, erc20Abi, type Address, type Hex } from "viem";
import { getWalletClient, switchChain } from "wagmi/actions";
import { executedBroadcast, pendingMultisigBroadcast, type BroadcastResult } from "../types";
import { wagmiConfig } from "./config";
import { activeSafeMode, sendViaSafe } from "./safe";

type SupportedEvmChainId = (typeof wagmiConfig)["chains"][number]["id"];

async function sendEvm(input: {
  chainId: number;
  to: Address;
  data?: Hex;
  value?: bigint;
}): Promise<BroadcastResult> {
  // A Safe is bound to one chain, so the Safe path validates the chain inside
  // `sendViaSafe` instead of prompting a switch.
  if (await activeSafeMode()) {
    return pendingMultisigBroadcast(await sendViaSafe({
      chainId: input.chainId,
      txs: [{ to: input.to, data: input.data ?? "0x", value: input.value ?? 0n }],
    }));
  }

  await switchChain(wagmiConfig, { chainId: input.chainId as SupportedEvmChainId });
  const client = await getWalletClient(wagmiConfig);
  if (!client) throw new Error("Connect an EVM wallet to send this payout");
  return executedBroadcast(await client.sendTransaction({
    to: input.to,
    data: input.data,
    value: input.value ?? 0n,
    chain: client.chain,
  }));
}

export async function transferNativeEvm(input: {
  chainId: number;
  to: string;
  amountIn: bigint;
}): Promise<BroadcastResult> {
  return sendEvm({
    chainId: input.chainId,
    to: input.to as Address,
    value: input.amountIn,
  });
}

export async function transferErc20(input: {
  chainId: number;
  tokenAddress: string;
  to: string;
  amountIn: bigint;
}): Promise<BroadcastResult> {
  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
    args: [input.to as Address, input.amountIn],
  });
  return sendEvm({
    chainId: input.chainId,
    to: input.tokenAddress as Address,
    data,
  });
}
