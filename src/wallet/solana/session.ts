import type { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";

export type SolanaSigner = {
  publicKey: PublicKey;
  signTransaction: <T extends Transaction | VersionedTransaction>(transaction: T) => Promise<T>;
};

export type SolanaWalletMeta = {
  name: string;
  isSquadsX: boolean;
};

let signer: SolanaSigner | null = null;
let walletMeta: SolanaWalletMeta | null = null;

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
