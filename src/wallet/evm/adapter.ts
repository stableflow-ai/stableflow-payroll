/**
 * EVM wallet adapter backed by wagmi + RainbowKit.
 *
 * Message signing uses ERC-191 (`personal_sign`) via wagmi `signMessageAsync`.
 */

import { useCallback, useMemo } from "react";
import { isAddress } from "viem";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import type { GeneratedIntent, IntentSignInput, IntentSignedPayload, UseWalletResult, WalletAccount } from "../types";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import {
  buildEvmFamilyPayload,
  encodeSecp256k1Signature,
  isoDeadline,
  nonceToBase64,
  payloadAsText,
  walletDoesNotSupportSigning,
} from "../intents-sign";

export function useEvmWallet(): UseWalletResult {
  const { address, chainId, isConnected, isConnecting, isReconnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const { signMessageAsync } = useSignMessage();

  const account = useMemo<WalletAccount | null>(() => {
    if (!address) return null;
    return {
      address,
      chainKind: "evm",
      chainId,
    };
  }, [address, chainId]);

  const signMessage = useCallback(
    async (input: IntentSignInput): Promise<IntentSignedPayload> => {
      if (!address) {
        throw new Error("[wallet:evm] No connected account to sign with.");
      }
      if (typeof signMessageAsync !== "function") {
        throw walletDoesNotSupportSigning("EVM");
      }
      const payload = buildEvmFamilyPayload(
        input.signerId,
        nonceToBase64(input.nonce),
        isoDeadline(input.deadlineMs),
      );
      const signature = await signMessageAsync({ message: payload });
      return {
        standard: "erc191",
        payload,
        signature: encodeSecp256k1Signature(signature),
      };
    },
    [address, signMessageAsync],
  );

  const signGeneratedIntent = useCallback(
    async (intent: GeneratedIntent): Promise<IntentSignedPayload> => {
      if (!address) {
        throw new Error("[wallet:evm] No connected account to sign with.");
      }
      if (typeof signMessageAsync !== "function") {
        throw walletDoesNotSupportSigning("EVM");
      }
      const payload = payloadAsText(intent.payload);
      const signature = await signMessageAsync({ message: payload });
      return {
        standard: "erc191",
        payload,
        signature: encodeSecp256k1Signature(signature),
      };
    },
    [address, signMessageAsync],
  );

  return useMemo<UseWalletResult>(() => ({
    kind: "evm",
    account,
    isConnected: Boolean(isConnected && address),
    isConnecting: isConnecting || isReconnecting,
    connect: () => openConnectModal?.(),
    disconnect,
    signMessage,
    signGeneratedIntent,
    isAddressValid: isAddress,
  }), [
    account,
    address,
    disconnect,
    isConnected,
    isConnecting,
    isReconnecting,
    openConnectModal,
    signMessage,
    signGeneratedIntent,
  ]);
}
