import { messageFactory, prepareBroadcastRequest } from "@defuse-protocol/internal-utils";
import type { IntentSignedPayload } from "../types";
import { walletDoesNotSupportSigning } from "../intents-sign";
import { PHANTOM_SIGN_DISPLAY } from "./config";

type SolanaAdapterSignMessage = (message: Uint8Array) => Promise<Uint8Array>;

type PhantomSignResult = Uint8Array | { signature: Uint8Array };

type PhantomSolanaProvider = {
  isPhantom?: boolean;
  signMessage: (message: Uint8Array, display?: string) => Promise<PhantomSignResult>;
};

type PhantomWindow = Window & {
  phantom?: { solana?: PhantomSolanaProvider };
  solana?: PhantomSolanaProvider;
};

function asIntentsUserId(signerId: string) {
  return signerId as Parameters<typeof messageFactory.makeEmptyMessage>[0]["signerId"];
}

function getPhantomProvider(): PhantomSolanaProvider | null {
  if (typeof window === "undefined") return null;
  const root = window as PhantomWindow;
  const fromNamespace = root.phantom?.solana;
  if (fromNamespace?.isPhantom && typeof fromNamespace.signMessage === "function") {
    return fromNamespace;
  }
  const fromInjected = root.solana;
  if (fromInjected?.isPhantom && typeof fromInjected.signMessage === "function") {
    return fromInjected;
  }
  return null;
}

function asSignatureBytes(value: unknown): Uint8Array | null {
  if (value instanceof Uint8Array) return value;
  if (value && typeof value === "object" && "signature" in value) {
    const signature = (value as { signature: unknown }).signature;
    if (signature instanceof Uint8Array) return signature;
  }
  return null;
}

export function createSolanaEmptyIntentBytes(input: {
  signerId: string;
  deadlineMs: number;
  nonce: Uint8Array;
}): Uint8Array {
  return messageFactory.makeEmptyMessage({
    signerId: asIntentsUserId(input.signerId),
    deadlineTimestamp: input.deadlineMs,
    nonce: input.nonce,
  }).SOLANA.message;
}

export function formatSolanaSignedData(
  signature: Uint8Array,
  signedMessage: Uint8Array,
  userAddress: string,
): IntentSignedPayload {
  const signed = prepareBroadcastRequest.prepareSwapSignedData(
    {
      type: "SOLANA",
      signatureData: signature,
      signedData: { message: signedMessage },
    },
    { userAddress, userChainType: "solana" },
  );
  if (
    signed.standard !== "raw_ed25519"
    || typeof signed.payload !== "string"
    || typeof signed.public_key !== "string"
    || typeof signed.signature !== "string"
  ) {
    throw new Error("[wallet:solana] Expected a raw_ed25519 signed payload");
  }
  return {
    standard: "raw_ed25519",
    payload: signed.payload,
    public_key: signed.public_key,
    signature: signed.signature,
  };
}

export async function signSolanaIntentsMessage(
  message: Uint8Array,
  adapterSignMessage?: SolanaAdapterSignMessage | null,
): Promise<Uint8Array> {
  const phantom = getPhantomProvider();
  if (phantom) {
    const signature = asSignatureBytes(
      await phantom.signMessage(message, PHANTOM_SIGN_DISPLAY),
    );
    if (!signature) {
      throw new Error("[wallet:solana] Phantom signMessage did not return a signature");
    }
    return signature;
  }
  if (typeof adapterSignMessage !== "function") {
    throw walletDoesNotSupportSigning("Solana");
  }
  return adapterSignMessage(message);
}
