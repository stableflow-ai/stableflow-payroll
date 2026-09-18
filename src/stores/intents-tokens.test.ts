import { describe, expect, it } from "vitest";
import { FIXED_CHAINS } from "@/config/chains";
import type { PayrollConfigToken } from "@/types/payroll-config";
import {
  WRAP_NEAR_CONTRACT,
  isNativeToken,
  isNearWrappedGasToken,
  mapConfigTokens,
  normalizeSymbol,
  tokenAssetId,
} from "./intents-tokens";

function configToken(partial: Partial<PayrollConfigToken> & Pick<PayrollConfigToken, "symbol" | "network">): PayrollConfigToken {
  return {
    decimals: 18,
    contractAddress: "",
    price: "1",
    supportPayment: true,
    supportReceive: true,
    ...partial,
  };
}

describe("normalizeSymbol", () => {
  it("maps aliases and uppercases symbols", () => {
    expect(normalizeSymbol("usdt0")).toBe("USDT");
    expect(normalizeSymbol("ETH")).toBe("ETH");
    expect(normalizeSymbol("sol")).toBe("SOL");
    expect(normalizeSymbol("WETH")).toBe("WETH");
    expect(normalizeSymbol("wNEAR")).toBe("NEAR");
    expect(normalizeSymbol("ZEC")).toBe("ZEC");
    expect(normalizeSymbol("RHEA")).toBe("RHEA");
    expect(normalizeSymbol("unknown")).toBe("UNKNOWN");
  });
});

describe("isNativeToken", () => {
  it("treats empty, native, and zero address as native", () => {
    expect(isNativeToken({ contractAddress: null })).toBe(true);
    expect(isNativeToken({ contractAddress: "" })).toBe(true);
    expect(isNativeToken({ contractAddress: "native" })).toBe(true);
    expect(isNativeToken({ contractAddress: "0x0000000000000000000000000000000000000000" })).toBe(true);
  });

  it("treats wrap.near and ERC-20 addresses as contracts", () => {
    expect(isNativeToken({ contractAddress: WRAP_NEAR_CONTRACT })).toBe(false);
    expect(isNativeToken({ contractAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" })).toBe(false);
  });
});

describe("isNearWrappedGasToken", () => {
  it("matches wrap.near on the Near chain only", () => {
    expect(isNearWrappedGasToken({
      blockchain: "near",
      contractAddress: WRAP_NEAR_CONTRACT,
    })).toBe(true);
    expect(isNearWrappedGasToken({
      blockchain: "bsc",
      contractAddress: WRAP_NEAR_CONTRACT,
    })).toBe(false);
  });
});

describe("mapConfigTokens", () => {
  it("keeps native Near NEAR and BSC NEAR when wrap.near is absent", () => {
    const tokens = mapConfigTokens([
      configToken({ symbol: "NEAR", network: "near", decimals: 24, contractAddress: "" }),
      configToken({
        symbol: "NEAR",
        network: "bsc",
        decimals: 18,
        contractAddress: "0x1fa4a73a3f0133f0025378af00236f3abdee5d63",
      }),
    ], FIXED_CHAINS);
    expect(tokens.map((token) => token.blockchain)).toEqual(["near", "bsc"]);
    expect(tokens[0]?.assetId).toBe(tokenAssetId("near", "NEAR", null));
    expect(isNativeToken(tokens[0])).toBe(true);
  });

  it("prefers wrap.near over native NEAR when both exist", () => {
    const tokens = mapConfigTokens([
      configToken({
        symbol: "wNEAR",
        network: "near",
        decimals: 24,
        contractAddress: WRAP_NEAR_CONTRACT,
      }),
      configToken({ symbol: "NEAR", network: "near", decimals: 24, contractAddress: "" }),
    ], FIXED_CHAINS);
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toMatchObject({
      symbol: "NEAR",
      providerSymbol: "wNEAR",
      contractAddress: WRAP_NEAR_CONTRACT,
      blockchain: "near",
    });
  });

  it("keeps ZEC on zec, sol, and near", () => {
    const tokens = mapConfigTokens([
      configToken({ symbol: "ZEC", network: "zec", decimals: 8, contractAddress: "" }),
      configToken({
        symbol: "ZEC",
        network: "sol",
        decimals: 8,
        contractAddress: "A7bdiYdS5GjqGFtxf17ppRHtDKPkkRqbKtR27dxvQXaS",
      }),
      configToken({
        symbol: "ZEC",
        network: "near",
        decimals: 8,
        contractAddress: "zec.omft.near",
      }),
    ], FIXED_CHAINS);
    expect(tokens.map((token) => token.blockchain)).toEqual(["zec", "sol", "near"]);
    expect(isNativeToken(tokens[0])).toBe(true);
    expect(tokens[1]?.contractAddress).toBe("A7bdiYdS5GjqGFtxf17ppRHtDKPkkRqbKtR27dxvQXaS");
    expect(tokens[2]?.contractAddress).toBe("zec.omft.near");
  });

  it("keeps RHEA on near and bsc", () => {
    const tokens = mapConfigTokens([
      configToken({
        symbol: "RHEA",
        network: "near",
        decimals: 18,
        contractAddress: "token.rhealab.near",
      }),
      configToken({
        symbol: "RHEA",
        network: "bsc",
        decimals: 18,
        contractAddress: "0x4c067de26475e1cefee8b8d1f6e2266b33a2372e",
      }),
    ], FIXED_CHAINS);
    expect(tokens.map((token) => token.blockchain)).toEqual(["near", "bsc"]);
  });

  it("keeps two Near ETH contracts as distinct asset ids", () => {
    const tokens = mapConfigTokens([
      configToken({
        symbol: "ETH",
        network: "near",
        contractAddress: "hood.omft.near",
      }),
      configToken({
        symbol: "ETH",
        network: "near",
        contractAddress: "eth.bridge.near",
      }),
    ], FIXED_CHAINS);
    expect(tokens).toHaveLength(2);
    expect(tokens[0]?.assetId).toBe(tokenAssetId("near", "ETH", "hood.omft.near"));
    expect(tokens[1]?.assetId).toBe(tokenAssetId("near", "ETH", "eth.bridge.near"));
  });
});
