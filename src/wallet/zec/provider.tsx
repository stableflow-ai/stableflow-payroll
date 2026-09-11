import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { NOIR_DOWNLOAD_URL } from "./config";
import {
  zcashWalletAdapter,
  zecConnectedAddress,
  zecShieldedAddress,
  zecTransparentAddress,
} from "./sdk";

export interface ZecWalletContextValue {
  account: string | null;
  shieldedAddress: string | null;
  transparentAddress: string | null;
  connecting: boolean;
  connect: () => void;
  disconnect: () => void;
}

const ZecWalletContext = createContext<ZecWalletContextValue | null>(null);

const EMPTY_ZEC_ADDRESSES = {
  account: null,
  shieldedAddress: null,
  transparentAddress: null,
} as const;

export function ZecWalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [shieldedAddress, setShieldedAddress] = useState<string | null>(null);
  const [transparentAddress, setTransparentAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const clearAddresses = useCallback(() => {
    setAccount(EMPTY_ZEC_ADDRESSES.account);
    setShieldedAddress(EMPTY_ZEC_ADDRESSES.shieldedAddress);
    setTransparentAddress(EMPTY_ZEC_ADDRESSES.transparentAddress);
  }, []);

  const syncAccount = useCallback(() => {
    setAccount(zecConnectedAddress());
    setShieldedAddress(zecShieldedAddress());
    setTransparentAddress(zecTransparentAddress());
  }, []);

  const connect = useCallback(() => {
    setConnecting(true);
    void (async () => {
      try {
        const installed = await zcashWalletAdapter.detect();
        if (!installed) {
          window.open(NOIR_DOWNLOAD_URL, "_blank");
          return;
        }
        await zcashWalletAdapter.connect();
        syncAccount();
      } catch (error: unknown) {
        console.error("[wallet:zec]", error);
      } finally {
        setConnecting(false);
      }
    })();
  }, [syncAccount]);

  const disconnect = useCallback(() => {
    void zcashWalletAdapter.disconnect().finally(() => {
      clearAddresses();
    });
  }, [clearAddresses]);

  useEffect(() => {
    let cancelled = false;

    const onConnect = () => {
      if (!cancelled) syncAccount();
    };
    const onDisconnect = () => {
      if (!cancelled) clearAddresses();
    };
    const onAccountChanged = () => {
      if (!cancelled) syncAccount();
    };

    zcashWalletAdapter.on("connect", onConnect);
    zcashWalletAdapter.on("disconnect", onDisconnect);
    zcashWalletAdapter.on("accountChanged", onAccountChanged);

    void (async () => {
      try {
        const installed = await zcashWalletAdapter.detect();
        if (!installed || cancelled) return;
        await zcashWalletAdapter.connect({ silent: true });
        if (!cancelled) syncAccount();
      } catch {
        // not connected
      }
    })();

    return () => {
      cancelled = true;
      zcashWalletAdapter.off("connect", onConnect);
      zcashWalletAdapter.off("disconnect", onDisconnect);
      zcashWalletAdapter.off("accountChanged", onAccountChanged);
    };
  }, [clearAddresses, syncAccount]);

  const value = useMemo<ZecWalletContextValue>(() => ({
    account,
    shieldedAddress,
    transparentAddress,
    connecting,
    connect,
    disconnect,
  }), [account, connect, connecting, disconnect, shieldedAddress, transparentAddress]);

  return (
    <ZecWalletContext.Provider value={value}>
      {children}
    </ZecWalletContext.Provider>
  );
}

export function useZecWalletContext(): ZecWalletContextValue {
  const ctx = useContext(ZecWalletContext);
  if (!ctx) {
    throw new Error("useZecWalletContext must be used within ZecWalletProvider");
  }
  return ctx;
}
