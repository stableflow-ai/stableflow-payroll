import { useCallback, useEffect, useMemo, useState } from "react";
import { isAddressValid } from "@/lib/address-validation";
import type { UseWalletResult, WalletAccount } from "../types";
import { useNearWalletContext } from "./provider";

export function useNearWallet(): UseWalletResult {
  const { selector, modal, accountId, connecting } = useNearWalletContext();
  const [modalOpen, setModalOpen] = useState(false);

  const account = useMemo<WalletAccount | null>(() => {
    if (!accountId) return null;
    return { address: accountId, chainKind: "near", chainId: "mainnet" };
  }, [accountId]);

  useEffect(() => {
    if (!modal) return;
    const sub = modal.on("onHide", (event) => {
      if (event.hideReason === "user-triggered") setModalOpen(false);
    });
    return () => sub.remove();
  }, [modal]);

  useEffect(() => {
    if (accountId) setModalOpen(false);
  }, [accountId]);

  const connect = useCallback(() => {
    const show = () => {
      setModalOpen(true);
      modal?.show();
    };
    if (!accountId || !selector) {
      show();
      return;
    }
    void (async () => {
      try {
        const wallet = await selector.wallet();
        await wallet.signOut();
      } catch {
        // Still open the picker so the user can switch wallets.
      }
      show();
    })();
  }, [accountId, modal, selector]);

  const disconnect = useCallback(() => {
    void (async () => {
      if (!selector) return;
      const wallet = await selector.wallet();
      await wallet.signOut();
    })();
  }, [selector]);

  const isAddressValidFn = useCallback((value: string) => isAddressValid(value, "near"), []);

  return useMemo<UseWalletResult>(() => ({
    kind: "near",
    account,
    isConnected: Boolean(accountId),
    isConnecting: connecting,
    isModalOpen: modalOpen,
    connect,
    disconnect,
    isAddressValid: isAddressValidFn,
  }), [account, accountId, connect, connecting, disconnect, isAddressValidFn, modalOpen]);
}
