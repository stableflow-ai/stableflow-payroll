import { WalletProvider as TronAdapterProvider } from "@tronweb3/tronwallet-adapter-react-hooks";
import { WalletModalProvider } from "@tronweb3/tronwallet-adapter-react-ui";
import "@tronweb3/tronwallet-adapter-react-ui/style.css";
import {
  BitKeepAdapter,
  OkxWalletAdapter,
  TokenPocketAdapter,
  TronLinkAdapter,
  WalletConnectAdapter,
} from "@tronweb3/tronwallet-adapters";
import { useMemo, type ReactNode } from "react";
import { TRON_APP_NAME, TRON_WALLETCONNECT_METADATA } from "./config";

export function TronWalletProvider({ children }: { children: ReactNode }) {
  const adapters = useMemo(() => {
    const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "00000000000000000000000000000000";
    return [
      new TronLinkAdapter(),
      new OkxWalletAdapter(),
      new BitKeepAdapter(),
      new TokenPocketAdapter(),
      new WalletConnectAdapter({
        network: "Mainnet",
        options: {
          relayUrl: "wss://relay.walletconnect.com",
          projectId,
          metadata: TRON_WALLETCONNECT_METADATA,
        },
      }),
    ];
  }, []);

  return (
    <TronAdapterProvider adapters={adapters} autoConnect onError={(error) => {
      console.error(`[wallet:tron] ${TRON_APP_NAME}`, error);
    }}>
      <WalletModalProvider>
        {children}
      </WalletModalProvider>
    </TronAdapterProvider>
  );
}
