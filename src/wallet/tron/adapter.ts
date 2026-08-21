import { useWallet as useTronAdapter } from "@tronweb3/tronwallet-adapter-react-hooks";
import { useWalletModal as useTronWalletModal } from "@tronweb3/tronwallet-adapter-react-ui";
import { useCallback, useMemo } from "react";
import { isAddressValid } from "@/utils";
import type { UseWalletResult, WalletAccount } from "../types";

export function useTronWallet(): UseWalletResult {
  const {
    address,
    connected,
    connecting,
    disconnect,
  } = useTronAdapter();
  const { setVisible, visible } = useTronWalletModal();

  const account = useMemo<WalletAccount | null>(() => {
    if (!address) return null;
    return { address, chainKind: "tron", chainId: "mainnet" };
  }, [address]);

  const connect = useCallback(() => {
    const openModal = () => setVisible(true);
    if (connected) {
      void Promise.resolve(disconnect()).finally(openModal);
      return;
    }
    openModal();
  }, [connected, disconnect, setVisible]);

  const isAddressValidFn = useCallback((value: string) => isAddressValid(value, "tron"), []);

  return useMemo<UseWalletResult>(() => ({
    kind: "tron",
    account,
    isConnected: Boolean(connected && address),
    isConnecting: connecting,
    isModalOpen: visible,
    connect,
    disconnect,
    isAddressValid: isAddressValidFn,
  }), [
    account,
    address,
    connect,
    connected,
    connecting,
    disconnect,
    isAddressValidFn,
    visible,
  ]);
}
