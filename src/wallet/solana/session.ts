import type { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";

export type SolanaSigner = {
  publicKey: PublicKey;
  signTransaction: <T extends Transaction | VersionedTransaction>(transaction: T) => Promise<T>;
};

let signer: SolanaSigner | null = null;

export function setSolanaSigner(next: SolanaSigner | null) {
  signer = next;
}

export function getSolanaSigner(): SolanaSigner | null {
  return signer;
}
