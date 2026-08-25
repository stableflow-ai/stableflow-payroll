/**
 * EVM ERC-20 balance helpers. Calldata encoding lives on the backend;
 * this module only reads on-chain state through the signed RPC layer.
 */

import {
  createPublicClient,
  erc20Abi,
  formatUnits,
  type Address,
  type Chain,
  type PublicClient,
} from "viem";
import {
  arbitrum,
  avalanche,
  base,
  berachain,
  bsc,
  gnosis,
  mainnet,
  monad,
  optimism,
  plasma,
  polygon,
  scroll,
  xLayer,
} from "viem/chains";
import { getChainByNetwork } from "@/config/chains";
import { evmTransportForBlockchain } from "@/lib/rpc/evm";

const chainById: Record<number, Chain> = {
  [mainnet.id]: mainnet,
  [base.id]: base,
  [arbitrum.id]: arbitrum,
  [gnosis.id]: gnosis,
  [berachain.id]: berachain,
  [bsc.id]: bsc,
  [monad.id]: monad,
  [plasma.id]: plasma,
  [polygon.id]: polygon,
  [optimism.id]: optimism,
  [avalanche.id]: avalanche,
  [xLayer.id]: xLayer,
  [scroll.id]: scroll,
};

const clients = new Map<string, PublicClient>();

function resolveChain(networkOrBlockchain: string): Chain | null {
  const chainId = getChainByNetwork(networkOrBlockchain)?.chainId;
  if (!chainId) return null;
  return chainById[chainId] ?? null;
}

export function getPublicClientForNetwork(networkOrBlockchain: string) {
  const chain = resolveChain(networkOrBlockchain);
  const config = getChainByNetwork(networkOrBlockchain);
  if (!chain || !config) return null;
  const cached = clients.get(config.blockchain);
  if (cached) return cached;
  const client = createPublicClient({
    chain,
    transport: evmTransportForBlockchain(config.blockchain),
  });
  clients.set(config.blockchain, client);
  return client;
}

export async function readErc20Balance(opts: {
  network: string;
  tokenAddress: Address;
  owner: Address;
  decimals: number;
}): Promise<{ raw: bigint; formatted: string }> {
  const client = getPublicClientForNetwork(opts.network);
  if (!client) throw new Error(`Unsupported network: ${opts.network}`);
  const raw = await client.readContract({
    address: opts.tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [opts.owner],
  });
  return { raw, formatted: formatUnits(raw, opts.decimals) };
}

export async function readErc20Allowance(opts: {
  network: string;
  tokenAddress: Address;
  owner: Address;
  spender: Address;
  blockNumber?: bigint;
}): Promise<bigint> {
  const client = getPublicClientForNetwork(opts.network);
  if (!client) throw new Error(`Unsupported network: ${opts.network}`);
  return client.readContract({
    address: opts.tokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: [opts.owner, opts.spender],
    ...(opts.blockNumber != null ? { blockNumber: opts.blockNumber } : {}),
  });
}

export type Erc20BalanceInput = {
  assetId: string;
  tokenAddress: Address;
  decimals: number;
};

export type Erc20BalanceResult =
  | { assetId: string; raw: bigint; formatted: string }
  | { assetId: string; error: string };

export async function readErc20Balances(opts: {
  network: string;
  owner: Address;
  tokens: Erc20BalanceInput[];
}): Promise<Erc20BalanceResult[]> {
  const client = getPublicClientForNetwork(opts.network);
  if (!client) {
    return opts.tokens.map((token) => ({
      assetId: token.assetId,
      error: `Unsupported network: ${opts.network}`,
    }));
  }
  if (opts.tokens.length === 0) return [];

  const results = await client.multicall({
    allowFailure: true,
    contracts: opts.tokens.map((token) => ({
      address: token.tokenAddress,
      abi: erc20Abi,
      functionName: "balanceOf" as const,
      args: [opts.owner] as const,
    })),
  });

  return opts.tokens.map((token, index) => {
    const result = results[index];
    if (!result || result.status !== "success") {
      const message = result && "error" in result && result.error instanceof Error
        ? result.error.message
        : "Failed to read balance";
      return { assetId: token.assetId, error: message };
    }
    return {
      assetId: token.assetId,
      raw: result.result,
      formatted: formatUnits(result.result, token.decimals),
    };
  });
}

export { erc20Abi };
