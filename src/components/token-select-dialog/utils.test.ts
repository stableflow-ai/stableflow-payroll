import { describe, expect, it } from "vitest";
import type { ChainConfig } from "@/config/chains";
import {
  chainBalanceUsd,
  chainHasBalance,
  initialChainFilter,
  matchesChainFilter,
  positiveBalanceTokens,
  recentTokensInOrder,
  sortChainsForSidebar,
  sortTokensByBalance,
  sortTokensBySymbol,
  tokenBalanceUsd,
  tokenMatchesSearch,
} from "./utils";
import { ALL_CHAIN_FILTER } from "./config";

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

describe("sortChainsForSidebar", () => {
  const available = [
    chain("eth", "Ethereum"),
    chain("base", "Base"),
    chain("near", "Near"),
  ];
  const tokens = [
    token("usdt-eth", "USDT", "Ethereum", { blockchain: "eth", price: 1 }),
    token("usdc-base", "USDC", "Base", { blockchain: "base", price: 1 }),
    token("eth-near", "ETH", "Near", { blockchain: "near", price: 1 }),
  ];
  const usd: Record<string, number> = { "usdt-eth": 10, "usdc-base": 50, "eth-near": 0 };

  it("orders funded chains by USD and leaves unfunded last", () => {
    const sorted = sortChainsForSidebar(available, tokens, {
      showBalances: true,
      getBalanceUsd: (item) => usd[item.assetId] ?? 0,
    });
    expect(sorted.map((item) => item.blockchain)).toEqual(["base", "eth", "near"]);
  });

  it("sums every positive token on the chain", () => {
    expect(chainBalanceUsd("eth", [
      token("a", "A", "Ethereum", { blockchain: "eth" }),
      token("b", "B", "Ethereum", { blockchain: "eth" }),
      token("c", "C", "Base", { blockchain: "base" }),
    ], (item) => (item.assetId === "a" ? 4 : item.assetId === "b" ? -1 : 9))).toBe(4);
  });

  it("keeps registry order when balances are hidden", () => {
    const sorted = sortChainsForSidebar(available, tokens, {
      showBalances: false,
      getBalanceUsd: () => 100,
    });
    expect(sorted.map((item) => item.blockchain)).toEqual(["eth", "base", "near"]);
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

describe("sortTokensByBalance", () => {
  const usdtEth = token("usdt-eth", "USDT", "Ethereum");
  const usdcArb = token("usdc-arb", "USDC", "Arbitrum");
  const usdtNear = token("usdt-near", "USDT", "NEAR");
  const zero = token("dai-eth", "DAI", "Ethereum");
  const usd: Record<string, number> = {
    "usdt-eth": 10,
    "usdc-arb": 50,
    "usdt-near": -1,
    "dai-eth": 0,
  };

  it("orders funded, then loading, then zero or unknown", () => {
    const sorted = sortTokensByBalance(
      [zero, usdtNear, usdtEth, usdcArb],
      (item) => usd[item.assetId] ?? -1,
      (item) => item.assetId === "usdt-near",
    );
    expect(sorted.map((item) => item.assetId)).toEqual([
      "usdc-arb",
      "usdt-eth",
      "usdt-near",
      "dai-eth",
    ]);
  });

  it("sorts by symbol when balances are not used", () => {
    expect(sortTokensBySymbol([usdtNear, usdcArb, usdtEth]).map((item) => item.assetId)).toEqual([
      "usdc-arb",
      "usdt-eth",
      "usdt-near",
    ]);
  });
});

describe("positiveBalanceTokens", () => {
  const funded = token("usdt-eth", "USDT", "Ethereum");
  const zero = token("dai-eth", "DAI", "Ethereum");

  it("drops zero and unknown balances", () => {
    const usd: Record<string, number> = { "usdt-eth": 10, "dai-eth": 0 };
    expect(positiveBalanceTokens([zero, funded], (item) => usd[item.assetId] ?? -1).map((item) => item.assetId)).toEqual([
      "usdt-eth",
    ]);
  });
});

describe("recentTokensInOrder", () => {
  const tokens = [
    token("usdt-eth", "USDT", "Ethereum"),
    token("usdc-arb", "USDC", "Arbitrum"),
    token("dai-eth", "DAI", "Ethereum"),
  ];

  it("follows most-recent-first and skips missing ids", () => {
    expect(recentTokensInOrder(tokens, ["dai-eth", "missing", "usdt-eth"]).map((item) => item.assetId)).toEqual([
      "dai-eth",
      "usdt-eth",
    ]);
  });

  it("all-search can match a token outside recent and funded lists", () => {
    const usd: Record<string, number> = { "usdt-eth": 10, "usdc-arb": 0, "dai-eth": 0 };
    const recent = recentTokensInOrder(tokens, ["usdt-eth"]);
    const yours = positiveBalanceTokens(tokens, (item) => usd[item.assetId] ?? -1);
    const searched = tokens.filter((item) => tokenMatchesSearch(item, "usdc"));
    expect(recent.map((item) => item.assetId)).toEqual(["usdt-eth"]);
    expect(yours.map((item) => item.assetId)).toEqual(["usdt-eth"]);
    expect(searched.map((item) => item.assetId)).toEqual(["usdc-arb"]);
  });
});
