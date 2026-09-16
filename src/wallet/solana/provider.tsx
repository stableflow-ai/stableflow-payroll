import { ConnectionContext, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  LedgerWalletAdapter,
  WalletConnectWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { useMemo, type ReactNode } from "react";
import { createSolanaHttpConnection, solanaPrimaryRpcUrl } from "@/lib/rpc/solana";
import {
  WalletAdapterNetwork,
  WalletConnectionError,
  WalletWindowClosedError,
} from "@solana/wallet-adapter-base";
import useToast from "@/hooks/use-toast";
import { reportWalletConnectError } from "../connect-feedback";
import { metadata } from "../metadata";

export function SolanaWalletProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new LedgerWalletAdapter(),
      new WalletConnectWalletAdapter({
        network: WalletAdapterNetwork.Mainnet,
        options: {
          metadata: metadata,
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
        if (error instanceof WalletConnectionError || error instanceof WalletWindowClosedError) {
          reportWalletConnectError(toast, error);
        }
      }}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionContext.Provider>
  );
}
