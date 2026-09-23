import { describe, expect, it } from "vitest";
import { mapPayrollConfig } from "./payroll-config";

describe("mapPayrollConfig", () => {
  it("maps snake_case chains and tokens", () => {
    const config = mapPayrollConfig({
      chains: [{
        network: "zec",
        chain_id: "",
        chain_name: "Zcash",
        logo: "https://example.com/zec.png",
        explorer: "https://explorer.zcha.in/transactions/",
      }],
      tokens: [{
        symbol: "NEAR",
        network: "near",
        decimals: 24,
        contract_address: "",
        price: "1.88",
        support_payment: true,
        support_receive: false,
      }],
    });
    expect(config.chains[0]).toEqual({
      network: "zec",
      chainId: "",
      chainName: "Zcash",
      logo: "https://example.com/zec.png",
      explorer: "https://explorer.zcha.in/transactions/",
    });
    expect(config.tokens[0]).toEqual({
      symbol: "NEAR",
      network: "near",
      decimals: 24,
      contractAddress: "",
      price: "1.88",
      supportPayment: true,
      supportReceive: false,
    });
  });
});
