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

function resolveChain(networkOrBlockchain: string): Chain | null {
  const chainId = getChainByNetwork(networkOrBlockchain)?.chainId;
  if (!chainId) return null;
  return chainById[chainId] ?? null;
}

export function getPublicClientForNetwork(networkOrBlockchain: string) {
  const chain = resolveChain(networkOrBlockchain);
  const config = getChainByNetwork(networkOrBlockchain);
  if (!chain || !config) return null;
  return createPublicClient({
    chain,
    transport: evmTransportForBlockchain(config.blockchain),
  });
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

export { erc20Abi };
