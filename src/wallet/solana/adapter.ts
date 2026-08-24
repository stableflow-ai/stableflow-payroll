import { useWallet as useSolanaAdapter } from "@solana/wallet-adapter-react";
import { useWalletModal as useSolanaWalletModal } from "@solana/wallet-adapter-react-ui";
import { useCallback, useMemo } from "react";
import { isAddressValid } from "@/utils";
import type { GeneratedIntent, IntentSignInput, IntentSignedPayload, UseWalletResult, WalletAccount } from "../types";
import {
  buildSolanaPayload,
  encodeEd25519,
  nonceToBase64,
  payloadAsText,
  unixTimestamp,
  walletDoesNotSupportSigning,
} from "../intents-sign";

export function useSolanaWallet(): UseWalletResult {
  const {
    publicKey,
    connected,
    connecting,
    disconnect,
    select,
    signMessage: adapterSignMessage,
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

  const signMessage = useCallback(
    async (input: IntentSignInput): Promise<IntentSignedPayload> => {
      if (!address || !publicKey) {
        throw new Error("[wallet:solana] No connected account to sign with.");
      }
      if (typeof adapterSignMessage !== "function") {
        throw walletDoesNotSupportSigning("Solana");
      }
      const payload = buildSolanaPayload(
        input.signerId,
        nonceToBase64(input.nonce),
        unixTimestamp(input.deadlineMs),
      );
      const signature = await adapterSignMessage(new TextEncoder().encode(payload));
      return {
        standard: "raw_ed25519",
        payload,
        public_key: encodeEd25519(publicKey.toBytes()),
        signature: encodeEd25519(signature),
      };
    },
    [adapterSignMessage, address, publicKey],
  );

  const signGeneratedIntent = useCallback(
    async (intent: GeneratedIntent): Promise<IntentSignedPayload> => {
      if (!address || !publicKey) {
        throw new Error("[wallet:solana] No connected account to sign with.");
      }
      if (typeof adapterSignMessage !== "function") {
        throw walletDoesNotSupportSigning("Solana");
      }
      const payload = payloadAsText(intent.payload);
      const signature = await adapterSignMessage(new TextEncoder().encode(payload));
      return {
        standard: "raw_ed25519",
        payload,
        public_key: encodeEd25519(publicKey.toBytes()),
        signature: encodeEd25519(signature),
      };
    },
    [adapterSignMessage, address, publicKey],
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
