import { useWallet as useSolanaAdapter } from "@solana/wallet-adapter-react";
import { useWalletModal as useSolanaWalletModal } from "@solana/wallet-adapter-react-ui";
import { useCallback, useEffect, useMemo } from "react";
import { isAddressValid } from "@/utils";
import type { GeneratedIntent, IntentSignInput, IntentSignedPayload, UseWalletResult, WalletAccount } from "../types";
import { payloadAsText } from "../intents-sign";
import { setSolanaSigner } from "./session";
import {
  createSolanaEmptyIntentBytes,
  formatSolanaSignedData,
  signSolanaIntentsMessage,
} from "./sign-intents-message";

export function useSolanaWallet(): UseWalletResult {
  const {
    publicKey,
    connected,
    connecting,
    disconnect,
    select,
    signMessage: adapterSignMessage,
    signTransaction,
  } = useSolanaAdapter();
  const { setVisible, visible } = useSolanaWalletModal();

  const address = publicKey?.toBase58() || null;

  useEffect(() => {
    if (!publicKey || !signTransaction) {
      setSolanaSigner(null);
      return;
    }
    setSolanaSigner({ publicKey, signTransaction });
    return () => setSolanaSigner(null);
  }, [publicKey, signTransaction]);

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

  const signMessage = useCallback(
    async (input: IntentSignInput): Promise<IntentSignedPayload> => {
      if (!address) {
        throw new Error("[wallet:solana] No connected account to sign with.");
      }
      const message = createSolanaEmptyIntentBytes({
        signerId: input.signerId,
        deadlineMs: input.deadlineMs,
        nonce: input.nonce,
      });
      const signature = await signSolanaIntentsMessage(message, adapterSignMessage);
      return formatSolanaSignedData(signature, message, address);
    },
    [adapterSignMessage, address],
  );

  const signGeneratedIntent = useCallback(
    async (intent: GeneratedIntent): Promise<IntentSignedPayload> => {
      if (!address) {
        throw new Error("[wallet:solana] No connected account to sign with.");
      }
      const payload = payloadAsText(intent.payload);
      const message = new TextEncoder().encode(payload);
      const signature = await signSolanaIntentsMessage(message, adapterSignMessage);
      return formatSolanaSignedData(signature, message, address);
    },
    [adapterSignMessage, address],
  );

  const isAddressValidFn = useCallback((value: string) => isAddressValid(value, "solana"), []);

  return useMemo<UseWalletResult>(() => ({
    kind: "solana",
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
