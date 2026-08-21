import { useCallback } from "react";
import { useEvmWalletInfo } from "@/hooks/use-evm-wallet-info";
import { useWallet } from "@/hooks/use-wallet";
import type { ChainKind } from "@/wallet";

export function usePaymentWallet(chainKind: ChainKind = "evm") {
  const wallet = useWallet(chainKind);
  const walletInfo = useEvmWalletInfo();
  const connectedAddress = wallet.account?.address || null;

  const ensureWalletReady = useCallback(async (): Promise<boolean> => {
    if (!wallet.isConnected || !connectedAddress) {
      wallet.connect();
      return false;
    }
    return true;
  }, [connectedAddress, wallet]);

  return {
    wallet,
    walletInfo,
    connectedAddress,
    connectWallet: wallet.connect,
    disconnect: wallet.disconnect,
    ensureWalletReady,
  };
}
