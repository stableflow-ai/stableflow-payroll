import { describe, expect, it } from "vitest";
import { mergeApiChain, mergeApiChains } from "./chains";

describe("mergeApiChain", () => {
  it("merges CHAIN_META and batch_pay", () => {
    expect(mergeApiChain({
      network: "zec",
      chainId: "",
      chainName: "Zcash",
      logo: "https://example.com/zec.png",
      explorer: "https://explorer.zcha.in/transactions/",
      batchPay: false,
    })).toMatchObject({
      blockchain: "zec",
      chainKind: "zec",
      batchEnabled: false,
      chainName: "Zcash",
    });
  });

  it("treats a non-empty chain_id as evm when CHAIN_META is missing", () => {
    expect(mergeApiChain({
      network: "newchain",
      chainId: "123",
      chainName: "New Chain",
      logo: "",
      explorer: "https://scan.example/tx/",
      batchPay: true,
    })).toMatchObject({
      blockchain: "newchain",
      chainKind: "evm",
      chainId: 123,
      batchEnabled: true,
    });
  });

  it("skips unknown networks with no chain id", () => {
    expect(mergeApiChain({
      network: "unknown",
      chainId: "",
      chainName: "Unknown",
      logo: "",
      explorer: "",
    })).toBeNull();
  });
});

describe("mergeApiChains", () => {
  it("drops rows that cannot be merged", () => {
    const chains = mergeApiChains([
      {
        network: "eth",
        chainId: "1",
        chainName: "Ethereum",
        logo: "",
        explorer: "https://etherscan.io/tx/",
        batchPay: true,
      },
      {
        network: "unknown",
        chainId: "",
        chainName: "Unknown",
        logo: "",
        explorer: "",
      },
    ]);
    expect(chains.map((chain) => chain.blockchain)).toEqual(["eth"]);
  });
});
