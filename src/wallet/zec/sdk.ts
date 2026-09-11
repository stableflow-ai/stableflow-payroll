import { NoirZcashWalletAdapter } from "@rhea-finance/zcash-wallet-adapter";
import { nonemptyZecAddress, zecQuoteAddressesFrom } from "./quote-addresses";

export const zcashWalletAdapter = new NoirZcashWalletAdapter({
  network: "mainnet",
});

export function zecShieldedAddress(): string | null {
  return nonemptyZecAddress(zcashWalletAdapter.shieldedAddress);
}

export function zecTransparentAddress(): string | null {
  return nonemptyZecAddress(zcashWalletAdapter.transparentAddress);
}

export function zecConnectedAddress(): string | null {
  return zecShieldedAddress() || zecTransparentAddress();
}

export function zecQuoteAddresses() {
  return zecQuoteAddressesFrom(zecShieldedAddress(), zecTransparentAddress());
}
