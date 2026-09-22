import type { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import type { SquadsSdkBinding } from "./multisig/types";

export type SolanaSigner = {
  publicKey: PublicKey;
  signTransaction: <T extends Transaction | VersionedTransaction>(transaction: T) => Promise<T>;
};

export type SolanaWalletMeta = {
  name: string;
  isSquadsX: boolean;
};

export type { SquadsSdkBinding };

let signer: SolanaSigner | null = null;
let walletMeta: SolanaWalletMeta | null = null;
let sdkBinding: SquadsSdkBinding | null = null;

export function setSolanaSigner(next: SolanaSigner | null) {
  signer = next;
}

export function getSolanaSigner(): SolanaSigner | null {
  return signer;
}

export function setSolanaWalletMeta(next: SolanaWalletMeta | null) {
  walletMeta = next;
}

export function getSolanaWalletMeta(): SolanaWalletMeta | null {
  return walletMeta;
}

export function setSquadsSdkBinding(next: SquadsSdkBinding | null) {
  sdkBinding = next;
}

export function getSquadsSdkBinding(): SquadsSdkBinding | null {
  return sdkBinding;
}
