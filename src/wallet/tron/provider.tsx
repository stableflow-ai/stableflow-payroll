import { WalletProvider as TronAdapterProvider, useWallet } from "@tronweb3/tronwallet-adapter-react-hooks";
import "@tronweb3/tronwallet-adapter-react-ui/style.css";
import {
  BitKeepAdapter,
  OkxWalletAdapter,
  TokenPocketAdapter,
  TronLinkAdapter,
  WalletConnectAdapter,
  LedgerAdapter,
} from "@tronweb3/tronwallet-adapters";
import { useEffect, useMemo, useRef, type MutableRefObject, type ReactNode } from "react";
import useToast from "@/hooks/use-toast";
import { isWalletConnectionRejected, reportWalletConnectError } from "../connect-feedback";
import { TRON_APP_NAME } from "./config";
import { TronWalletModalProvider } from "./select-modal";
import { metadata } from "../metadata";

function TronRejectDeselect({ deselectRef }: { deselectRef: MutableRefObject<() => void> }) {
  const { disconnect } = useWallet();
  useEffect(() => {
    deselectRef.current = () => {
      void disconnect();
    };
  }, [deselectRef, disconnect]);
  return null;
}

export function TronWalletProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const deselectRef = useRef<() => void>(() => {});
  const adapters = useMemo(() => {
    const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "00000000000000000000000000000000";
    return [
      new TronLinkAdapter(),
      new OkxWalletAdapter(),
      new BitKeepAdapter(),
      new TokenPocketAdapter(),
      new LedgerAdapter(),
      new WalletConnectAdapter({
        network: "Mainnet",
        options: {
          relayUrl: "wss://relay.walletconnect.com",
          projectId,
          metadata: metadata,
        },
      }),
    ];
  }, []);

  return (
    <TronAdapterProvider adapters={adapters} autoConnect disableAutoConnectOnLoad onError={(error) => {
      console.error(`[wallet:tron] ${TRON_APP_NAME}`, error);
      reportWalletConnectError(toast, error);
      if (isWalletConnectionRejected(error)) deselectRef.current();
    }}>
      <TronRejectDeselect deselectRef={deselectRef} />
      <TronWalletModalProvider>
        {children}
      </TronWalletModalProvider>
    </TronAdapterProvider>
  );
}
