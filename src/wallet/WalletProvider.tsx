/**
 * Root wallet provider tree.
 *
 * Wagmi/RainbowKit (EVM) wraps Solana, Near, and Tron adapters so UI can
 * connect any of the four without page-level provider changes.
 */

import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import type { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "./evm/config";
import { NearWalletProvider } from "./near/provider";
import { SolanaWalletProvider } from "./solana/provider";
import { TronWalletProvider } from "./tron/provider";
import { WalletSync } from "./WalletSync";

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <RainbowKitProvider>
        <SolanaWalletProvider>
          <NearWalletProvider>
            <TronWalletProvider>
              <WalletSync />
              {children}
            </TronWalletProvider>
          </NearWalletProvider>
        </SolanaWalletProvider>
      </RainbowKitProvider>
    </WagmiProvider>
  );
}
