export const NEAR_CONNECT_NETWORK = "mainnet" as const;

export const NEAR_CONNECT_WALLET_IDS = [
  "hot-wallet",
  "meteor-wallet",
  "intear-wallet",
  "okx-wallet",
  "ledger",
  "near-mobile",
  "nightly-wallet",
  "wallet-connect",
] as const;

export const NEAR_CONNECT_WALLET_ID_SET = new Set<string>(NEAR_CONNECT_WALLET_IDS);

export const NEAR_WALLET_CONNECT_METADATA = {
  name: "StableFlow Pay",
  description: "Pay with stablecoins anywhere.",
  url: "https://pay.stableflow.ai",
} as const;

export function isAllowedNearConnectWalletId(id: string): boolean {
  return NEAR_CONNECT_WALLET_ID_SET.has(id);
}

export function applyNearConnectWalletAllowlist<
  TWallet extends { manifest: { id: string } },
  TManifest extends { id: string },
>(connector: {
  wallets: TWallet[];
  manifest: { wallets: TManifest[] };
}) {
  connector.manifest.wallets = connector.manifest.wallets.filter((wallet) =>
    isAllowedNearConnectWalletId(wallet.id),
  );
  connector.wallets = connector.wallets.filter((wallet) =>
    isAllowedNearConnectWalletId(wallet.manifest.id),
  );
}
