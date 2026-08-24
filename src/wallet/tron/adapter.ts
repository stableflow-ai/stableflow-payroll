import { useWallet as useTronAdapter } from "@tronweb3/tronwallet-adapter-react-hooks";
import { useWalletModal as useTronWalletModal } from "@tronweb3/tronwallet-adapter-react-ui";
import { useCallback, useMemo } from "react";
import { isAddressValid } from "@/utils";
import type { GeneratedIntent, IntentSignInput, IntentSignedPayload, UseWalletResult, WalletAccount } from "../types";
import {
  buildEvmFamilyPayload,
  encodeSecp256k1Signature,
  isoDeadline,
  nonceToBase64,
  payloadAsText,
  walletDoesNotSupportSigning,
} from "../intents-sign";

export function useTronWallet(): UseWalletResult {
  const {
    address,
    connected,
    connecting,
    disconnect,
    signMessage: adapterSignMessage,
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

  const signMessage = useCallback(
    async (input: IntentSignInput): Promise<IntentSignedPayload> => {
      if (!address) {
        throw new Error("[wallet:tron] No connected account to sign with.");
      }
      if (typeof adapterSignMessage !== "function") {
        throw walletDoesNotSupportSigning("Tron");
      }
      const payload = buildEvmFamilyPayload(
        input.signerId,
        nonceToBase64(input.nonce),
        isoDeadline(input.deadlineMs),
      );
      const signature = await adapterSignMessage(payload);
      return {
        standard: "tip191",
        payload,
        signature: encodeSecp256k1Signature(signature),
      };
    },
    [adapterSignMessage, address],
  );

  const signGeneratedIntent = useCallback(
    async (intent: GeneratedIntent): Promise<IntentSignedPayload> => {
      if (!address) {
        throw new Error("[wallet:tron] No connected account to sign with.");
      }
      if (typeof adapterSignMessage !== "function") {
        throw walletDoesNotSupportSigning("Tron");
      }
      const payload = payloadAsText(intent.payload);
      const signature = await adapterSignMessage(payload);
      return {
        standard: "tip191",
        payload,
        signature: encodeSecp256k1Signature(signature),
      };
    },
    [adapterSignMessage, address],
  );

  const isAddressValidFn = useCallback((value: string) => isAddressValid(value, "tron"), []);

  return useMemo<UseWalletResult>(() => ({
    kind: "tron",
    account,
    isConnected: Boolean(connected && address),
    isConnecting: connecting,
    isModalOpen: visible,
    connect,
    disconnect,
    signMessage,
    signGeneratedIntent,
    isAddressValid: isAddressValidFn,
  }), [
    account,
    address,
    connect,
    connected,
    connecting,
    disconnect,
    isAddressValidFn,
    signGeneratedIntent,
    signMessage,
    visible,
  ]);
}
