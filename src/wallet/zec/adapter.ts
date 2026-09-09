import { useCallback, useMemo } from "react";
import { isAddressValid } from "@/utils";
import type { GeneratedIntent, IntentSignInput, IntentSignedPayload, UseWalletResult, WalletAccount } from "../types";
import { walletDoesNotSupportSigning } from "../intents-sign";
import { NOIR_ICON_URL } from "./config";
import { useZecWalletContext } from "./provider";

export function useZecWallet(): UseWalletResult {
  const { account: address, connecting, connect, disconnect } = useZecWalletContext();

  const account = useMemo<WalletAccount | null>(() => {
    if (!address) return null;
    return { address, chainKind: "zec", chainId: "mainnet", icon: NOIR_ICON_URL };
  }, [address]);

  const signMessage = useCallback(
    async (_input: IntentSignInput): Promise<IntentSignedPayload> => {
      throw walletDoesNotSupportSigning("Zcash");
    },
    [],
  );

  const signGeneratedIntent = useCallback(
    async (_intent: GeneratedIntent): Promise<IntentSignedPayload> => {
      throw walletDoesNotSupportSigning("Zcash");
    },
    [],
  );

  const isAddressValidFn = useCallback((value: string) => isAddressValid(value, "zec"), []);

  return useMemo<UseWalletResult>(() => ({
    kind: "zec",
    account,
    isConnected: Boolean(address),
    isConnecting: connecting,
    connect,
    disconnect,
    signMessage,
    signGeneratedIntent,
    isAddressValid: isAddressValidFn,
  }), [
    account,
    address,
    connect,
    connecting,
    disconnect,
    isAddressValidFn,
    signGeneratedIntent,
    signMessage,
  ]);
}
