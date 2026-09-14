import { AdapterState } from "@tronweb3/tronwallet-abstract-adapter";
import type { Wallet } from "@tronweb3/tronwallet-adapter-react-hooks";
import { TRON_WALLETCONNECT_ADAPTER_NAME } from "./config";

export function visibleTronWallets(wallets: Wallet[]): Wallet[] {
  const detected = wallets.filter(
    (wallet) => wallet.state !== AdapterState.NotFound && wallet.state !== AdapterState.Loading,
  );
  if (detected.length > 0) return detected;
  return wallets.filter((wallet) => wallet.adapter.name === TRON_WALLETCONNECT_ADAPTER_NAME);
}
