/**
 * Unified wallet hook. Connection state lives in Zustand; this file is the
 * React API for UI (connect / disconnect / current account per chain).
 */

import { FIXED_CHAIN_KINDS } from "@/config/chains";
import { useWalletStore, walletAddressValid } from "@/stores/wallet";
import type { ChainKind, ChainOwners, GeneratedIntent, UseWalletResult } from "@/wallet/types";

export function useWallet(chainKind: ChainKind = "evm"): UseWalletResult {
  const slice = useWalletStore((state) => state.chains[chainKind]);
  const connect = useWalletStore((state) => state.connect);
  const disconnect = useWalletStore((state) => state.disconnect);
  const signMessage = useWalletStore((state) => state.signMessage);
  const signGeneratedIntent = useWalletStore((state) => state.signGeneratedIntent);

  return {
    kind: chainKind,
    account: slice.account,
    isConnected: Boolean(slice.account),
    isConnecting: slice.connecting,
    isModalOpen: slice.modalOpen,
    connect: () => connect(chainKind),
    disconnect: () => disconnect(chainKind),
    signMessage: (input) => signMessage(chainKind, input),
    signGeneratedIntent: (intent: GeneratedIntent) => signGeneratedIntent(chainKind, intent),
    isAddressValid: (address) => walletAddressValid(chainKind, address),
  };
}

export function useConnectedWallets(): ChainOwners {
  return useWalletStore((state) => state.owners);
}

export function primaryConnectedAddress(owners: ChainOwners): string | null {
  if (owners.evm && FIXED_CHAIN_KINDS.has("evm")) {
    return owners.evm;
  }
  if (owners.solana && FIXED_CHAIN_KINDS.has("solana")) {
    return owners.solana;
  }
  if (owners.near && FIXED_CHAIN_KINDS.has("near")) {
    return owners.near;
  }
  if (owners.tron && FIXED_CHAIN_KINDS.has("tron")) {
    return owners.tron;
  }
  return null;
}
