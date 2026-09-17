import { describe, expect, it } from "vitest";
import type { IntentsToken } from "@/stores/intents-tokens";
import { applyPayOriginToken } from "./use-pay-origin-token";

const TOKEN = {
  assetId: "sol:usdc",
  decimals: 6,
  blockchain: "sol",
  symbol: "USDC",
  providerSymbol: "USDC",
  price: 1,
  contractAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  logo: "",
  chain: {
    blockchain: "sol",
    chainName: "Solana",
    chainKind: "solana",
    logo: "",
    payerEnabled: true,
    batchEnabled: true,
    txExplorer: "",
  },
} as IntentsToken;

describe("applyPayOriginToken", () => {
  it("stores a session token when remember is false", () => {
    expect(applyPayOriginToken(false, TOKEN)).toEqual({
      kind: "session",
      sessionOrigin: TOKEN,
    });
  });

  it("clears the session origin when remember is false", () => {
    expect(applyPayOriginToken(false, null)).toEqual({
      kind: "session",
      sessionOrigin: null,
    });
  });

  it("clears the saved origin when remember is true", () => {
    expect(applyPayOriginToken(true, null)).toEqual({
      kind: "saved",
      savedOriginAssetId: null,
    });
  });
});
