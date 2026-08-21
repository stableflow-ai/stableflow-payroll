import { useWallet as useSolanaAdapter } from "@solana/wallet-adapter-react";
import { useWalletModal as useSolanaWalletModal } from "@solana/wallet-adapter-react-ui";
import { useCallback, useMemo } from "react";
import { isAddressValid } from "@/lib/address-validation";
import type { UseWalletResult, WalletAccount } from "../types";

export function useSolanaWallet(): UseWalletResult {
  const {
    publicKey,
    connected,
    connecting,
    disconnect,
    select,
  } = useSolanaAdapter();
  const { setVisible, visible } = useSolanaWalletModal();

  const address = publicKey?.toBase58() || null;

  const account = useMemo<WalletAccount | null>(() => {
    if (!address) return null;
    return { address, chainKind: "solana", chainId: "mainnet-beta" };
  }, [address]);

  const connect = useCallback(() => {
    const openModal = () => setVisible(true);
    if (connected) {
      void Promise.resolve(disconnect()).finally(() => {
        select(null);
        openModal();
      });
      return;
    }
    openModal();
  }, [connected, disconnect, select, setVisible]);

  const isAddressValidFn = useCallback((value: string) => isAddressValid(value, "solana"), []);

  return useMemo<UseWalletResult>(() => ({
    kind: "solana",
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
