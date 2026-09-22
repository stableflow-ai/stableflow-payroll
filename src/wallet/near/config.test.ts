import { describe, expect, it } from "vitest";
import {
  applyNearConnectWalletAllowlist,
  isAllowedNearConnectWalletId,
  NEAR_CONNECT_WALLET_IDS,
} from "./config";

describe("NEAR connect wallet allowlist", () => {
  it("keeps the nine product wallets", () => {
    expect([...NEAR_CONNECT_WALLET_IDS]).toEqual([
      "hot-wallet",
      "meteor-wallet",
      "intear-wallet",
      "okx-wallet",
      "ledger",
      "near-mobile",
      "nightly-wallet",
      "wallet-connect",
      "trezu-wallet",
    ]);
  });

  it("rejects wallets outside the allowlist", () => {
    expect(isAllowedNearConnectWalletId("mynearwallet")).toBe(false);
    expect(isAllowedNearConnectWalletId("hot-wallet")).toBe(true);
    expect(isAllowedNearConnectWalletId("trezu-wallet")).toBe(true);
  });

  it("drops unlisted wallets from the connector lists", () => {
    const connector = {
      wallets: [
        { manifest: { id: "hot-wallet" } },
        { manifest: { id: "mynearwallet" } },
      ],
      manifest: {
        wallets: [{ id: "hot-wallet" }, { id: "hana-wallet" }],
      },
    };
    applyNearConnectWalletAllowlist(connector);
    expect(connector.wallets.map((wallet) => wallet.manifest.id)).toEqual(["hot-wallet"]);
    expect(connector.manifest.wallets.map((wallet) => wallet.id)).toEqual(["hot-wallet"]);
  });
});
