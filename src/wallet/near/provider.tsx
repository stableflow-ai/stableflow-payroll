import {
  setupWalletSelector,
  type WalletSelector,
} from "@near-wallet-selector/core";
import { setupIntearWallet } from "@near-wallet-selector/intear-wallet";
import { setupHotWallet } from "@near-wallet-selector/hot-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupModal, type WalletSelectorModal } from "@near-wallet-selector/modal-ui";
import { setupWalletConnect } from "rhea-wallet-connect";
import "@near-wallet-selector/modal-ui/styles.css";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getLogo } from "@/lib/logo";

interface NearWalletContextValue {
  selector: WalletSelector | null;
  modal: WalletSelectorModal | null;
  accountId: string | null;
  connecting: boolean;
}

const NearWalletContext = createContext<NearWalletContextValue>({
  selector: null,
  modal: null,
  accountId: null,
  connecting: false,
});

export function NearWalletProvider({ children }: { children: ReactNode }) {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<WalletSelectorModal | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    void (async () => {
      try {
        const nextSelector = await setupWalletSelector({
          network: "mainnet",
          debug: false,
          modules: [
            setupIntearWallet(),
            setupMeteorWallet(),
            setupHotWallet() as never,
            setupWalletConnect({
              projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "",
              metadata: {
                name: "StableFlow Pay",
                description: "Pay with stablecoins anywhere.",
                url: "https://pay.stableflow.ai",
                icons: [getLogo("/stableflow/logos/logo-stableflow.svg")]
              },
              chainId: "near:mainnet"
            }),
          ],
        });
        if (cancelled) return;
        const nextModal = setupModal(nextSelector, { contractId: "" });
        const syncAccounts = () => {
          const state = nextSelector.store.getState();
          const active = state.accounts.find((account) => account.active)?.accountId || null;
          setAccountId(active);
        };
        syncAccounts();
        const subscription = nextSelector.store.observable.subscribe(syncAccounts);
        unsubscribe = () => subscription.unsubscribe();
        setSelector(nextSelector);
        setModal(nextModal);
      } catch (error) {
        console.error("[wallet:near] Failed to initialize wallet selector", error);
      } finally {
        if (!cancelled) setConnecting(false);
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const value = useMemo<NearWalletContextValue>(
    () => ({ selector, modal, accountId, connecting }),
    [selector, modal, accountId, connecting],
  );

  return <NearWalletContext.Provider value={value}>{children}</NearWalletContext.Provider>;
}

export function useNearWalletContext() {
  return useContext(NearWalletContext);
}
