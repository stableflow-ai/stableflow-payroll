/**
 * Unified wallet hook. Connection state lives in Zustand; this file is the
 * React API for UI (connect / disconnect / current account per chain).
 */

import { useWalletStore, walletAddressValid } from "@/stores/wallet";
import type { ChainKind, ChainOwners, UseWalletResult } from "@/wallet/types";

export function useWallet(chainKind: ChainKind = "evm"): UseWalletResult {
  const slice = useWalletStore((state) => state.chains[chainKind]);
  const connect = useWalletStore((state) => state.connect);
  const disconnect = useWalletStore((state) => state.disconnect);

  return {
    kind: chainKind,
    account: slice.account,
    isConnected: Boolean(slice.account),
    isConnecting: slice.connecting,
    isModalOpen: slice.modalOpen,
    connect: () => connect(chainKind),
    disconnect: () => disconnect(chainKind),
    isAddressValid: (address) => walletAddressValid(chainKind, address),
  };
}

export function useConnectedWallets(): ChainOwners {
  return useWalletStore((state) => state.owners);
}

export function primaryConnectedAddress(owners: ChainOwners): string | null {
  return owners.evm || owners.solana || owners.near || owners.tron || null;
}
