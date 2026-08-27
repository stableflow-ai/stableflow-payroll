import type { WalletSelector } from "@near-wallet-selector/core";

let selector: WalletSelector | null = null;

export function setNearSelector(next: WalletSelector | null) {
  selector = next;
}

export function getNearSelector(): WalletSelector | null {
  return selector;
}
