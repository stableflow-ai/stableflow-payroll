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
  connectZec,
  disconnectZec,
  getAccountsZec,
  getZecWallet,
  isNoirWalletInstalled,
} from "./sdk";

export interface ZecWalletContextValue {
  account: string | null;
  connecting: boolean;
  connect: () => void;
  disconnect: () => void;
}

const ZecWalletContext = createContext<ZecWalletContextValue | null>(null);

function transparentAccount(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object" && "transparent" in value) {
    const transparent = (value as { transparent?: unknown }).transparent;
    if (typeof transparent === "string" && transparent.trim()) return transparent.trim();
  }
  return null;
}

export function ZecWalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const connect = useCallback(() => {
    if (!isNoirWalletInstalled()) {
      window.open(NOIR_DOWNLOAD_URL, "_blank");
      return;
    }
    setConnecting(true);
    void connectZec()
      .then((result) => {
        setAccount(result.transparent || null);
      })
      .catch((error: unknown) => {
        console.error("[wallet:zec]", error);
      })
      .finally(() => {
        setConnecting(false);
      });
  }, []);

  const disconnect = useCallback(() => {
    void disconnectZec().finally(() => {
      setAccount(null);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    let onAccountsChanged: ((data?: unknown) => void) | null = null;

    const silentReconnect = async () => {
      if (!isNoirWalletInstalled()) return;
      try {
        const accounts = await getAccountsZec();
        if (cancelled) return;
        if (accounts?.transparent) setAccount(accounts.transparent);
      } catch {
        // not connected
      }
    };

    void silentReconnect();

    try {
      const zcash = getZecWallet();
      onAccountsChanged = (data?: unknown) => {
        const next = transparentAccount(Array.isArray(data) ? data[0] : data);
        if (!next) {
          setAccount(null);
          return;
        }
        setAccount(next);
      };
      zcash.on("accountsChanged", onAccountsChanged);
    } catch {
      // extension not available
    }

    return () => {
      cancelled = true;
      if (!onAccountsChanged) return;
      try {
        getZecWallet().removeListener("accountsChanged", onAccountsChanged);
      } catch {
        // ignore
      }
    };
  }, []);

  const value = useMemo<ZecWalletContextValue>(() => ({
    account,
    connecting,
    connect,
    disconnect,
  }), [account, connect, connecting, disconnect]);

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
