import { AdapterState } from "@tronweb3/tronwallet-abstract-adapter";
import type { Wallet } from "@tronweb3/tronwallet-adapter-react-hooks";
import { TRON_LEDGER_ADAPTER_NAME, TRON_WALLETCONNECT_ADAPTER_NAME } from "./config";

const ALWAYS_VISIBLE = new Set([TRON_WALLETCONNECT_ADAPTER_NAME, TRON_LEDGER_ADAPTER_NAME]);

export function visibleTronWallets(wallets: Wallet[]): Wallet[] {
  const detected = wallets.filter(
    (wallet) =>
      (wallet.state !== AdapterState.NotFound && wallet.state !== AdapterState.Loading)
      || ALWAYS_VISIBLE.has(wallet.adapter.name),
  );
  if (detected.length > 0) return detected;
  return wallets.filter((wallet) => ALWAYS_VISIBLE.has(wallet.adapter.name));
}
