/**
 * EVM wallet configuration (RainbowKit + wagmi + viem).
 *
 * Transports use the signed RPC proxy with public fallbacks from lib/rpc.
 */

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
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
} from "wagmi/chains";
import { evmTransportForBlockchain } from "@/lib/rpc/evm";

const chains = [
  mainnet,
  base,
  arbitrum,
  optimism,
  polygon,
  bsc,
  avalanche,
  gnosis,
  scroll,
  monad,
  xLayer,
  plasma,
  berachain,
] as const;

export const wagmiConfig = getDefaultConfig({
  appName: "Stableflow Pay",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "00000000000000000000000000000000",
  chains,
  transports: {
    [mainnet.id]: evmTransportForBlockchain("eth"),
    [base.id]: evmTransportForBlockchain("base"),
    [arbitrum.id]: evmTransportForBlockchain("arb"),
    [optimism.id]: evmTransportForBlockchain("op"),
    [polygon.id]: evmTransportForBlockchain("pol"),
    [bsc.id]: evmTransportForBlockchain("bsc"),
    [avalanche.id]: evmTransportForBlockchain("avax"),
    [gnosis.id]: evmTransportForBlockchain("gnosis"),
    [scroll.id]: evmTransportForBlockchain("scroll"),
    [monad.id]: evmTransportForBlockchain("monad"),
    [xLayer.id]: evmTransportForBlockchain("xlayer"),
    [plasma.id]: evmTransportForBlockchain("plasma"),
    [berachain.id]: evmTransportForBlockchain("bera"),
  },
  ssr: false,
});
