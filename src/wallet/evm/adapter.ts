/**
 * EVM wallet adapter backed by wagmi + RainbowKit.
 */

import { useMemo } from "react";
import { isAddress } from "viem";
import { useAccount, useDisconnect } from "wagmi";
import type { UseWalletResult, WalletAccount } from "../types";
import { useConnectModal } from "@rainbow-me/rainbowkit";

export function useEvmWallet(): UseWalletResult {
  const { address, chainId, isConnected, isConnecting, isReconnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();

  const account = useMemo<WalletAccount | null>(() => {
    if (!address) return null;
    return {
      address,
      chainKind: "evm",
      chainId,
    };
  }, [address, chainId]);

  return useMemo<UseWalletResult>(() => ({
    kind: "evm",
    account,
    isConnected: Boolean(isConnected && address),
    isConnecting: isConnecting || isReconnecting,
    connect: () => openConnectModal?.(),
    disconnect,
    isAddressValid: isAddress,
  }), [
    account,
    address,
    disconnect,
    isConnected,
    isConnecting,
    isReconnecting,
  ]);
}
