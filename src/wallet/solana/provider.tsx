import { ConnectionContext, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  WalletConnectWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { useMemo, type ReactNode } from "react";
import { createSolanaHttpConnection, solanaPrimaryRpcUrl } from "@/lib/rpc/solana";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import useToast from "@/hooks/use-toast";
import { metadata } from "../metadata";
import { LedgerConnectDialog } from "./LedgerConnectDialog";
import { SolanaLedgerWalletAdapter } from "./ledger-adapter";
import { reportSolanaWalletError } from "./utils";
import { installSolanaWalletConnectConnectPatch } from "./walletconnect-connect";

installSolanaWalletConnectConnectPatch();

export function SolanaWalletProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new SolanaLedgerWalletAdapter({
        network: WalletAdapterNetwork.Mainnet,
        options: {
          metadata,
          projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "",
        },
      }),
      new WalletConnectWalletAdapter({
        network: WalletAdapterNetwork.Mainnet,
        options: {
          metadata,
          projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "",
        },
      }),
    ],
    [],
  );
  const connection = useMemo(
    () => createSolanaHttpConnection(solanaPrimaryRpcUrl()),
    [],
  );

  return (
    <ConnectionContext.Provider value={{ connection }}>
      <WalletProvider wallets={wallets} autoConnect onError={(error) => {
        reportSolanaWalletError(toast, error);
      }}>
        <WalletModalProvider>
          {children}
          <LedgerConnectDialog />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionContext.Provider>
  );
}
