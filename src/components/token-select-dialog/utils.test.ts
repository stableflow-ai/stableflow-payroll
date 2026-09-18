import { describe, expect, it } from "vitest";
import type { ChainConfig } from "@/config/chains";
import {
  chainHasBalance,
  initialChainFilter,
  overflowNetworkCount,
  matchesChainFilter,
  sortTokensForSelect,
  tokenBalanceUsd,
  tokenMatchesSearch,
  visibleNetworkChips,
} from "./utils";
import { ALL_CHAIN_FILTER, NETWORK_CHIP_COUNT } from "./config";

function chain(blockchain: string, chainName = blockchain): ChainConfig {
  return {
    blockchain,
    chainName,
    chainKind: blockchain === "near" || blockchain === "sol" ? blockchain === "near" ? "near" : "solana" : "evm",
    logo: "",
    batchEnabled: true,
    txExplorer: "/",
  };
}

function token(assetId: string, symbol: string, chainName: string, extras?: {
  providerSymbol?: string;
  contractAddress?: string | null;
  blockchain?: string;
  price?: number;
}): {
  assetId: string;
  symbol: string;
  providerSymbol: string;
  contractAddress: string | null;
  blockchain: string;
  price: number;
  chain: { chainName: string };
} {
  return {
    assetId,
    symbol,
    providerSymbol: extras?.providerSymbol ?? symbol,
    contractAddress: extras?.contractAddress ?? null,
    blockchain: extras?.blockchain ?? "eth",
    price: extras?.price ?? 1,
    chain: { chainName },
  };
}

describe("tokenBalanceUsd", () => {
  it("multiplies balance by price", () => {
    expect(tokenBalanceUsd({ price: 4000 }, "0.05")).toBe(200);
    expect(tokenBalanceUsd({ price: 1 }, "100")).toBe(100);
  });

  it("returns -1 for unknown balance", () => {
    expect(tokenBalanceUsd({ price: 1 }, null)).toBe(-1);
    expect(tokenBalanceUsd({ price: 1 }, undefined)).toBe(-1);
    expect(tokenBalanceUsd({ price: 1 }, "—")).toBe(-1);
  });

  it("returns 0 for a zero balance", () => {
    expect(tokenBalanceUsd({ price: 1 }, "0")).toBe(0);
  });

  it("treats a non-finite price as 0", () => {
    expect(tokenBalanceUsd({ price: Number.NaN }, "10")).toBe(0);
  });
});

describe("tokenMatchesSearch", () => {
  const usdt = token("eth-usdt", "USDT", "Ethereum", {
    providerSymbol: "USDT0",
    contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  });

  it("matches symbol, provider symbol, and address", () => {
    expect(tokenMatchesSearch(usdt, "usdt")).toBe(true);
    expect(tokenMatchesSearch(usdt, "USDT0")).toBe(true);
    expect(tokenMatchesSearch(usdt, "0xa0b86991")).toBe(true);
  });

  it("does not match chain name", () => {
    expect(tokenMatchesSearch(usdt, "ethereum")).toBe(false);
  });

  it("matches an empty query", () => {
    expect(tokenMatchesSearch(usdt, "  ")).toBe(true);
  });
});

describe("matchesChainFilter", () => {
  it("lets every chain through All", () => {
    expect(matchesChainFilter({ blockchain: "near" }, ALL_CHAIN_FILTER)).toBe(true);
    expect(matchesChainFilter({ blockchain: "eth" }, "eth")).toBe(true);
    expect(matchesChainFilter({ blockchain: "eth" }, "base")).toBe(false);
  });
});

describe("visibleNetworkChips", () => {
  const available = [
    chain("eth", "Ethereum"),
    chain("base", "Base"),
    chain("arb", "Arbitrum"),
    chain("op", "Optimism"),
    chain("pol", "Polygon"),
    chain("near", "Near"),
    chain("sol", "Solana"),
  ];

  it("orders recent chains before registry fill", () => {
    expect(visibleNetworkChips(available, ["near", "sol"], NETWORK_CHIP_COUNT).map((item) => item.blockchain)).toEqual([
      "near",
      "sol",
      "eth",
      "base",
      "arb",
    ]);
  });

  it("does not duplicate a recent chain", () => {
    expect(visibleNetworkChips(available, ["eth"], 3).map((item) => item.blockchain)).toEqual([
      "eth",
      "base",
      "arb",
    ]);
  });

  it("ignores a recent chain that is not available", () => {
    expect(visibleNetworkChips(available, ["tron"], 2).map((item) => item.blockchain)).toEqual(["eth", "base"]);
  });

  it("pins the selected chain first even when it is not recent", () => {
    expect(visibleNetworkChips(available, ["near"], NETWORK_CHIP_COUNT, "sol").map((item) => item.blockchain)).toEqual([
      "sol",
      "near",
      "eth",
      "base",
      "arb",
    ]);
  });
});

describe("initialChainFilter", () => {
  const chains = [
    chain("eth", "Ethereum"),
    chain("base", "Base"),
    chain("sol", "Solana"),
    chain("near", "Near"),
  ];

  it("returns All when unlocked", () => {
    expect(initialChainFilter(null, ["sol"], chains)).toBe(ALL_CHAIN_FILTER);
  });

  it("selects the only chain for a locked kind", () => {
    expect(initialChainFilter("solana", ["eth"], chains)).toBe("sol");
  });

  it("prefers the most recent matching EVM chain", () => {
    expect(initialChainFilter("evm", ["sol", "base", "eth"], chains)).toBe("base");
  });

  it("falls back to the first matching chain", () => {
    expect(initialChainFilter("evm", ["sol", "near"], chains)).toBe("eth");
  });
});

describe("overflowNetworkCount", () => {
  it("returns remaining chains after the visible chips", () => {
    expect(overflowNetworkCount(15, 5)).toBe(10);
    expect(overflowNetworkCount(3, 5)).toBe(0);
  });
});

describe("chainHasBalance", () => {
  const tokens = [
    { blockchain: "eth" },
    { blockchain: "eth" },
    { blockchain: "near" },
  ];

  it("is true when any token on that chain has a positive balance", () => {
    const balances = ["0", "1.2", "0"];
    expect(chainHasBalance("eth", tokens, (token) => balances[tokens.indexOf(token)])).toBe(true);
    expect(chainHasBalance("near", tokens, () => "0")).toBe(false);
  });
});

describe("sortTokensForSelect", () => {
  const usdtEth = token("usdt-eth", "USDT", "Ethereum");
  const usdcArb = token("usdc-arb", "USDC", "Arbitrum");
  const usdtNear = token("usdt-near", "USDT", "NEAR");

  it("pins the recently used token first", () => {
    const sorted = sortTokensForSelect([usdcArb, usdtEth, usdtNear], {
      lastAssetId: "usdt-near",
      showBalances: false,
      getBalanceUsd: () => -1,
    });
    expect(sorted.map((item) => item.assetId)).toEqual(["usdt-near", "usdc-arb", "usdt-eth"]);
  });

  it("sorts the rest by USD then symbol", () => {
    const usd: Record<string, number> = { "usdt-eth": 10, "usdc-arb": 50, "usdt-near": 1 };
    const sorted = sortTokensForSelect([usdtEth, usdcArb, usdtNear], {
      lastAssetId: null,
      showBalances: true,
      getBalanceUsd: (item) => usd[item.assetId] ?? -1,
    });
    expect(sorted.map((item) => item.assetId)).toEqual(["usdc-arb", "usdt-eth", "usdt-near"]);
  });
});
