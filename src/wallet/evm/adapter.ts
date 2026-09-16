/**
 * EVM wallet adapter backed by wagmi + RainbowKit.
 *
 * Message signing uses ERC-191 (`personal_sign`) via wagmi `signMessageAsync`.
 * A Safe cannot produce one — it signs through EIP-1271 — so both signing paths
 * refuse outright rather than handing NEAR Intents a signature it will reject.
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import { isAddress } from "viem";
import { useAccount, useConnectors, useDisconnect, useSignMessage, type Connector } from "wagmi";
import type { GeneratedIntent, IntentSignInput, IntentSignedPayload, UseWalletResult, WalletAccount } from "../types";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import useToast from "@/hooks/use-toast";
import { withWalletConnectError } from "../connect-feedback";
import {
  buildEvmFamilyPayload,
  encodeSecp256k1Signature,
  isoDeadline,
  nonceToBase64,
  payloadAsText,
  walletDoesNotSupportSigning,
} from "../intents-sign";
import { useSafeMode } from "./safe";

export function useEvmWallet(): UseWalletResult {
  const { address, chainId, isConnected, isConnecting, isReconnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const connectors = useConnectors();
  const { signMessageAsync } = useSignMessage();
  const { isSafe } = useSafeMode();
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  useEffect(() => {
    const originals = new Map<Connector, Connector["connect"]>();
    for (const connector of connectors) {
      originals.set(connector, connector.connect);
      const original = connector.connect.bind(connector) as (...args: never[]) => ReturnType<Connector["connect"]>;
      connector.connect = ((...args: never[]) =>
        withWalletConnectError(toastRef.current, () => original(...args))
      ) as Connector["connect"];
    }
    return () => {
      for (const [connector, original] of originals) {
        connector.connect = original;
      }
    };
  }, [connectors]);

  const account = useMemo<WalletAccount | null>(() => {
    if (!address) return null;
    return {
      address,
      chainKind: "evm",
      chainId,
    };
  }, [address, chainId]);

  const connect = useCallback(() => {
    openConnectModal?.();
  }, [openConnectModal]);

  const signMessage = useCallback(
    async (input: IntentSignInput): Promise<IntentSignedPayload> => {
      if (!address) {
        throw new Error("[wallet:evm] No connected account to sign with.");
      }
      if (typeof signMessageAsync !== "function" || isSafe) {
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
    [address, isSafe, signMessageAsync],
  );

  const signGeneratedIntent = useCallback(
    async (intent: GeneratedIntent): Promise<IntentSignedPayload> => {
      if (!address) {
        throw new Error("[wallet:evm] No connected account to sign with.");
      }
      if (typeof signMessageAsync !== "function" || isSafe) {
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
    [address, isSafe, signMessageAsync],
  );

  return useMemo<UseWalletResult>(() => ({
    kind: "evm",
    account,
    isConnected: Boolean(isConnected && address),
    isConnecting: isConnecting || isReconnecting,
    connect,
    disconnect,
    signMessage,
    signGeneratedIntent,
    isAddressValid: isAddress,
  }), [
    account,
    address,
    connect,
    disconnect,
    isConnected,
    isConnecting,
    isReconnecting,
    signMessage,
    signGeneratedIntent,
  ]);
}
