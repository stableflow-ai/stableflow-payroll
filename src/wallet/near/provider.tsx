import { NearConnector, type NearWalletBase } from "@hot-labs/near-connect";
import SignClient from "@walletconnect/sign-client";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getLogo } from "@/lib/logo";
import {
  applyNearConnectWalletAllowlist,
  NEAR_CONNECT_NETWORK,
  NEAR_WALLET_CONNECT_METADATA,
} from "./config";
import { setNearConnector } from "./session";

interface NearWalletContextValue {
  connector: NearConnector | null;
  accountId: string | null;
  walletIcon: string | null;
  connecting: boolean;
}

const NearWalletContext = createContext<NearWalletContextValue>({
  connector: null,
  accountId: null,
  walletIcon: null,
  connecting: false,
});

function createNearWalletConnectClient() {
  const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID?.trim();
  if (!projectId) return undefined;
  return SignClient.init({
    projectId,
    metadata: {
      ...NEAR_WALLET_CONNECT_METADATA,
      icons: [getLogo("/stableflow/logos/logo-stableflow.svg")],
    },
  });
}

function accountIdFrom(accounts: readonly { accountId: string }[] | undefined) {
  return accounts?.[0]?.accountId?.trim() || null;
}

export function NearWalletProvider({ children }: { children: ReactNode }) {
  const [connector, setConnector] = useState<NearConnector | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [walletIcon, setWalletIcon] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const next = new NearConnector({
      network: NEAR_CONNECT_NETWORK,
      autoConnect: true,
      footerBranding: null,
      walletConnect: createNearWalletConnectClient(),
    });

    const syncWallet = (wallet: NearWalletBase | null, accounts?: readonly { accountId: string }[]) => {
      const id = accountIdFrom(accounts);
      setAccountId(id);
      setWalletIcon(id ? wallet?.manifest.icon || null : null);
    };

    const onSignIn = ({ wallet, accounts }: { wallet: NearWalletBase; accounts: { accountId: string }[] }) => {
      syncWallet(wallet, accounts);
    };
    const onSignOut = () => {
      syncWallet(null);
    };

    void (async () => {
      try {
        await next.whenManifestLoaded;
        if (cancelled) return;
        applyNearConnectWalletAllowlist(next);
        next.on("wallet:signIn", onSignIn);
        next.on("wallet:signOut", onSignOut);
        setNearConnector(next);
        setConnector(next);
        try {
          const connected = await next.getConnectedWallet();
          if (cancelled) return;
          syncWallet(connected.wallet, connected.accounts);
        } catch {
          if (!cancelled) syncWallet(null);
        }
      } catch (error) {
        console.error("[wallet:near] Failed to initialize Near connector", error);
      } finally {
        if (!cancelled) setConnecting(false);
      }
    })();

    return () => {
      cancelled = true;
      next.off("wallet:signIn", onSignIn);
      next.off("wallet:signOut", onSignOut);
      setNearConnector(null);
    };
  }, []);

  const value = useMemo<NearWalletContextValue>(
    () => ({ connector, accountId, walletIcon, connecting }),
    [connector, accountId, walletIcon, connecting],
  );

  return <NearWalletContext.Provider value={value}>{children}</NearWalletContext.Provider>;
}

export function useNearWalletContext() {
  return useContext(NearWalletContext);
}
