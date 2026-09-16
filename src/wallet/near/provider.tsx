import {
  setupWalletSelector,
  type WalletSelector,
} from "@near-wallet-selector/core";
import { setupIntearWallet } from "@near-wallet-selector/intear-wallet";
import { setupHotWallet } from "@near-wallet-selector/hot-wallet";
import { setupLedger } from "@near-wallet-selector/ledger";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupModal, type WalletSelectorModal } from "@near-wallet-selector/modal-ui";
import { setupWalletConnect } from "rhea-wallet-connect";
import "@near-wallet-selector/modal-ui/styles.css";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getLogo } from "@/lib/logo";
import useToast from "@/hooks/use-toast";
import { withWalletConnectError } from "../connect-feedback";
import { setNearSelector } from "./session";

type ConnectToast = { fail: (params: { title: string }) => void };

function assignMethod<T extends object, K extends PropertyKey>(
  target: T,
  key: K,
  value: unknown,
) {
  try {
    (target as Record<PropertyKey, unknown>)[key] = value;
  } catch {
    Object.defineProperty(target, key, { configurable: true, writable: true, value });
  }
}

function patchWalletSignIn(wallet: object, getToast: () => ConnectToast) {
  const current = wallet as { signIn?: (...args: never[]) => Promise<unknown> };
  if (typeof current.signIn !== "function") return;
  const signIn = current.signIn.bind(wallet) as (...args: never[]) => Promise<unknown>;
  assignMethod(
    wallet,
    "signIn",
    (...args: never[]) => withWalletConnectError(getToast(), () => signIn(...args)),
  );
}

function patchSelectorModuleWallets(selector: WalletSelector, getToast: () => ConnectToast) {
  const patchedModules = new WeakSet<object>();
  const patchedWallets = new WeakSet<object>();
  for (const module of selector.store.getState().modules) {
    if (patchedModules.has(module)) continue;
    patchedModules.add(module);
    const originalWallet = module.wallet.bind(module);
    assignMethod(module, "wallet", async () => {
      const wallet = await originalWallet();
      if (wallet && !patchedWallets.has(wallet)) {
        patchedWallets.add(wallet);
        patchWalletSignIn(wallet, getToast);
      }
      return wallet;
    });
  }
}

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
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

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
            setupLedger(),
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
        patchSelectorModuleWallets(nextSelector, () => toastRef.current);
        const nextModal = setupModal(nextSelector, { contractId: "" });
        setNearSelector(nextSelector);
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
      setNearSelector(null);
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
