import { describe, expect, it } from "vitest";
import {
  WRAP_NEAR_ASSET_ID,
  WRAP_NEAR_CONTRACT,
  filterTokens,
  isNativeToken,
  isNearWrappedGasToken,
  normalizeSymbol,
} from "./intents-tokens";

describe("normalizeSymbol", () => {
  it("maps aliases and accepts payout symbols", () => {
    expect(normalizeSymbol("usdt0")).toBe("USDT");
    expect(normalizeSymbol("ETH")).toBe("ETH");
    expect(normalizeSymbol("sol")).toBe("SOL");
    expect(normalizeSymbol("WETH")).toBe("WETH");
    expect(normalizeSymbol("wNEAR")).toBe("NEAR");
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
      assetId: WRAP_NEAR_ASSET_ID,
      contractAddress: WRAP_NEAR_CONTRACT,
    })).toBe(true);
    expect(isNearWrappedGasToken({
      blockchain: "bsc",
      assetId: WRAP_NEAR_ASSET_ID,
      contractAddress: WRAP_NEAR_CONTRACT,
    })).toBe(false);
  });
});

describe("filterTokens", () => {
  it("maps Near wNEAR to NEAR, drops BSC NEAR, and prefers wrap.near over native NEAR", () => {
    const tokens = filterTokens([
      {
        assetId: WRAP_NEAR_ASSET_ID,
        decimals: 24,
        blockchain: "near",
        symbol: "wNEAR",
        price: 1.88,
        contractAddress: WRAP_NEAR_CONTRACT,
      },
      {
        assetId: "nep141:near",
        decimals: 24,
        blockchain: "near",
        symbol: "NEAR",
        contractAddress: null,
      },
      {
        assetId: "erc20:bsc:near",
        decimals: 18,
        blockchain: "bsc",
        symbol: "NEAR",
        contractAddress: "0x1fa4a73a3f0133f0025378af00236f3abdee5d63",
      },
    ]);
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toMatchObject({
      assetId: WRAP_NEAR_ASSET_ID,
      symbol: "NEAR",
      providerSymbol: "wNEAR",
      contractAddress: WRAP_NEAR_CONTRACT,
      blockchain: "near",
    });
  });

  it("keeps ZEC on zec, sol, and near", () => {
    const tokens = filterTokens([
      {
        assetId: "nep141:zec.omft.near",
        decimals: 8,
        blockchain: "zec",
        symbol: "ZEC",
        price: 1178.24,
        contractAddress: null,
      },
      {
        assetId: "1cs_v1:sol:spl:A7bdiYdS5GjqGFtxf17ppRHtDKPkkRqbKtR27dxvQXaS",
        decimals: 8,
        blockchain: "sol",
        symbol: "ZEC",
        price: 1178.24,
        contractAddress: "A7bdiYdS5GjqGFtxf17ppRHtDKPkkRqbKtR27dxvQXaS",
      },
      {
        assetId: "1cs_v1:near:nep141:zec.omft.near",
        decimals: 8,
        blockchain: "near",
        symbol: "ZEC",
        price: 1178.24,
        contractAddress: "zec.omft.near",
      },
    ]);
    expect(tokens.map((token) => token.blockchain)).toEqual(["zec", "sol", "near"]);
    expect(tokens.every((token) => token.symbol === "ZEC")).toBe(true);
    expect(isNativeToken(tokens[0])).toBe(true);
    expect(tokens[1]?.contractAddress).toBe("A7bdiYdS5GjqGFtxf17ppRHtDKPkkRqbKtR27dxvQXaS");
    expect(tokens[2]?.contractAddress).toBe("zec.omft.near");
  });
});
