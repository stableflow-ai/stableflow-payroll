/**
 * EVM wallet configuration (RainbowKit + wagmi + viem).
 *
 * Transports use the signed RPC proxy with public fallbacks from lib/rpc.
 */

import { connectorsForWallets } from "@rainbow-me/rainbowkit";
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
import { createConfig } from "wagmi";
import {
  metaMaskWallet,
  base as baseWallet,
  okxWallet,
  bitgetWallet,
  binanceWallet,
  walletConnectWallet,
  rabbyWallet,
  phantomWallet,
  ledgerWallet,
} from "@rainbow-me/rainbowkit/wallets";

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

export const metadata = {
  name: "Stableflow Pay",
  description: "Stableflow Pay: USDC and USDT payroll for global teams.",
  // origin must match your domain & subdomain
  url: "https://payroll.stableflow.ai",
  icons: ["https://payroll.stableflow.ai/logo.svg"]
};

const connectors: any = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        okxWallet,
        metaMaskWallet,
        baseWallet,
        bitgetWallet,
        binanceWallet,
        rabbyWallet,
        phantomWallet,
        ledgerWallet,
        walletConnectWallet,
      ],
    },
  ],
  {
    appName: metadata.name,
    appDescription: metadata.description,
    appUrl: metadata.url,
    appIcon: metadata.icons[0],
    projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "",
  }
);

export const wagmiConfig = createConfig({
  connectors,
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
