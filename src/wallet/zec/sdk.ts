import { NoirZcashWalletAdapter } from "@rhea-finance/zcash-wallet-adapter";

export const zcashWalletAdapter = new NoirZcashWalletAdapter({
  network: "mainnet",
});

export function zecConnectedAddress(): string | null {
  return zcashWalletAdapter.shieldedAddress || zcashWalletAdapter.transparentAddress;
}
