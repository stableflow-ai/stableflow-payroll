import { Buffer } from "buffer";
import { useCallback, useEffect, useMemo, useState } from "react";
import { isAddressValid } from "@/utils";
import type { GeneratedIntent, IntentSignInput, IntentSignedPayload, UseWalletResult, WalletAccount } from "../types";
import { useNearWalletContext } from "./provider";
import {
  INTENTS_RECIPIENT,
  buildNep413Message,
  encodeEd25519,
  isoDeadline,
  nonceToBase64,
  parseNep413Payload,
  walletDoesNotSupportSigning,
} from "../intents-sign";

export function useNearWallet(): UseWalletResult {
  const { selector, modal, accountId, connecting } = useNearWalletContext();
  const [modalOpen, setModalOpen] = useState(false);

  const account = useMemo<WalletAccount | null>(() => {
    if (!accountId) return null;
    return { address: accountId, chainKind: "near", chainId: "mainnet" };
  }, [accountId]);

  useEffect(() => {
    if (!modal) return;
    const sub = modal.on("onHide", (event) => {
      if (event.hideReason === "user-triggered") setModalOpen(false);
    });
    return () => sub.remove();
  }, [modal]);

  useEffect(() => {
    if (accountId) setModalOpen(false);
  }, [accountId]);

  const connect = useCallback(() => {
    const show = () => {
      setModalOpen(true);
      modal?.show();
    };
    if (!accountId || !selector) {
      show();
      return;
    }
    void (async () => {
      try {
        const wallet = await selector.wallet();
        await wallet.signOut();
      } catch {
        // Still open the picker so the user can switch wallets.
      }
      show();
    })();
  }, [accountId, modal, selector]);

  const disconnect = useCallback(() => {
    void (async () => {
      if (!selector) return;
      const wallet = await selector.wallet();
      await wallet.signOut();
    })();
  }, [selector]);

  const signMessage = useCallback(
    async (input: IntentSignInput): Promise<IntentSignedPayload> => {
      if (!selector || !accountId) {
        throw new Error("[wallet:near] No connected account to sign with.");
      }
      const wallet = await selector.wallet();
      if (typeof wallet.signMessage !== "function") {
        throw walletDoesNotSupportSigning("NEAR");
      }
      const recipient = input.recipient || INTENTS_RECIPIENT;
      const nonce = Buffer.from(input.nonce);
      const message = buildNep413Message(input.signerId, isoDeadline(input.deadlineMs));
      const signed = await wallet.signMessage({
        message,
        recipient,
        nonce,
      });
      if (!signed?.signature || !signed.publicKey) {
        throw new Error("[wallet:near] Wallet did not return a signature.");
      }
      return {
        standard: "nep413",
        payload: {
          recipient,
          nonce: nonceToBase64(input.nonce),
          message,
        },
        public_key: encodeEd25519(signed.publicKey),
        signature: encodeEd25519(signed.signature),
      };
    },
    [accountId, selector],
  );

  const signGeneratedIntent = useCallback(
    async (intent: GeneratedIntent): Promise<IntentSignedPayload> => {
      if (!selector || !accountId) {
        throw new Error("[wallet:near] No connected account to sign with.");
      }
      const wallet = await selector.wallet();
      if (typeof wallet.signMessage !== "function") {
        throw walletDoesNotSupportSigning("NEAR");
      }
      const parsed = parseNep413Payload(intent.payload);
      const signed = await wallet.signMessage({
        message: parsed.message,
        recipient: parsed.recipient,
        nonce: Buffer.from(parsed.nonce),
      });
      if (!signed?.signature || !signed.publicKey) {
        throw new Error("[wallet:near] Wallet did not return a signature.");
      }
      return {
        standard: "nep413",
        payload: {
          recipient: parsed.recipient,
          nonce: nonceToBase64(parsed.nonce),
          message: parsed.message,
        },
        public_key: encodeEd25519(signed.publicKey),
        signature: encodeEd25519(signed.signature),
      };
    },
    [accountId, selector],
  );

  const isAddressValidFn = useCallback((value: string) => isAddressValid(value, "near"), []);

  return useMemo<UseWalletResult>(() => ({
    kind: "near",
    account,
    isConnected: Boolean(accountId),
    isConnecting: connecting,
    isModalOpen: modalOpen,
    connect,
    disconnect,
    signMessage,
    signGeneratedIntent,
    isAddressValid: isAddressValidFn,
  }), [account, accountId, connect, connecting, disconnect, isAddressValidFn, modalOpen, signGeneratedIntent, signMessage]);
}
