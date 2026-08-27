import type { Adapter } from "@tronweb3/tronwallet-abstract-adapter";

export type TronSigner = {
  address: string;
  signTransaction: Adapter["signTransaction"];
};

let signer: TronSigner | null = null;

export function setTronSigner(next: TronSigner | null) {
  signer = next;
}

export function getTronSigner(): TronSigner | null {
  return signer;
}
