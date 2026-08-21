import { useEffect } from "react";
import { useWalletStore } from "@/stores/wallet";
import { useEvmWallet } from "./evm/adapter";
import { useNearWallet } from "./near/adapter";
import { useSolanaWallet } from "./solana/adapter";
import { useTronWallet } from "./tron/adapter";
import type { ChainKind, UseWalletResult } from "./types";

function useSyncChainWallet(kind: ChainKind, wallet: UseWalletResult) {
  const sync = useWalletStore((state) => state.sync);
  const registerActions = useWalletStore((state) => state.registerActions);

  useEffect(() => {
    sync(kind, {
      account: wallet.account,
      connecting: wallet.isConnecting,
      modalOpen: wallet.isModalOpen ?? false,
    });
  }, [kind, sync, wallet.account, wallet.isConnecting, wallet.isModalOpen]);

  useEffect(() => {
    registerActions(kind, {
      connect: wallet.connect,
      disconnect: wallet.disconnect,
    });
  }, [kind, registerActions, wallet.connect, wallet.disconnect]);
}

/** Subscribes to all chain adapters once at the root and writes into the Zustand store. */
export function WalletSync() {
  const evm = useEvmWallet();
  const near = useNearWallet();
  const solana = useSolanaWallet();
  const tron = useTronWallet();

  useSyncChainWallet("evm", evm);
  useSyncChainWallet("near", near);
  useSyncChainWallet("solana", solana);
  useSyncChainWallet("tron", tron);

  return null;
}
