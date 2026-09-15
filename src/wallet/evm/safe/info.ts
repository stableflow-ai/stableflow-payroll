/**
 * Safe account state read straight from the contract.
 *
 * Never cached: `threshold` and `owners` change through owner management, and
 * `nonce` must be current because the cancellation check in `resolve.ts` compares
 * against the value captured at proposal time.
 */

import type { Address } from "viem";
import { getPublicClientForChainId } from "../balance";
import { safeReadAbi } from "./abi";
import { SAFE_UNSUPPORTED_CHAIN_MESSAGE } from "./config";
import type { SafeAccountInfo } from "./types";

export async function getSafeInfo(input: {
  chainId: number;
  address: Address;
}): Promise<SafeAccountInfo> {
  const client = getPublicClientForChainId(input.chainId);
  if (!client) throw new Error(`${SAFE_UNSUPPORTED_CHAIN_MESSAGE}: ${input.chainId}`);

  const { address, chainId } = input;
  const [threshold, owners, nonce, version] = await Promise.all([
    client.readContract({ address, abi: safeReadAbi, functionName: "getThreshold" }),
    client.readContract({ address, abi: safeReadAbi, functionName: "getOwners" }),
    client.readContract({ address, abi: safeReadAbi, functionName: "nonce" }),
    client.readContract({ address, abi: safeReadAbi, functionName: "VERSION" }),
  ]);

  return {
    safeAddress: address,
    chainId,
    threshold: Number(threshold),
    owners: [...owners],
    nonce: Number(nonce),
    version,
  };
}

/**
 * Transaction nonce only.
 *
 * `blockNumber` pins the read to one block so it can be compared against a log
 * scan that covered the same block without the two racing each other.
 */
export async function getSafeNonce(input: {
  chainId: number;
  address: Address;
  blockNumber?: bigint;
}): Promise<number> {
  const client = getPublicClientForChainId(input.chainId);
  if (!client) throw new Error(`${SAFE_UNSUPPORTED_CHAIN_MESSAGE}: ${input.chainId}`);
  const nonce = await client.readContract({
    address: input.address,
    abi: safeReadAbi,
    functionName: "nonce",
    ...(input.blockNumber != null ? { blockNumber: input.blockNumber } : {}),
  });
  return Number(nonce);
}
