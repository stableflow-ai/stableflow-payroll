import { describe, expect, it } from "vitest";
import {
  buildPaymentRequestSearch,
  parsePaymentRequestSearch,
  receivingAddressError,
} from "./request-utils";

describe("receivingAddressError", () => {
  it("rejects empty and unrecognized addresses", () => {
    expect(receivingAddressError("", "evm")).toBe("Address cannot be empty");
    expect(receivingAddressError("???", "evm")).toBe("Unrecognized address");
  });

  it("rejects a token chain that does not match the address", () => {
    expect(
      receivingAddressError("0x1111111111111111111111111111111111111111", "solana"),
    ).toBe("Token network does not match address type");
  });

  it("accepts a matching EVM address", () => {
    expect(receivingAddressError("0x1111111111111111111111111111111111111111", "evm")).toBeNull();
  });
});

describe("payment request search", () => {
  it("round-trips required fields and omits empty memo", () => {
    const search = buildPaymentRequestSearch({
      address: " 0x1111111111111111111111111111111111111111 ",
      amount: "100.5",
      token: "USDC",
      network: "arb",
      uid: 42,
      memo: "  ",
      receivePrivately: false,
    });
    expect(search).not.toContain("memo=");
    expect(search).not.toContain("private=");
    expect(parsePaymentRequestSearch(search)).toEqual({
      addr: "0x1111111111111111111111111111111111111111",
      amount: "100.5",
      token: "USDC",
      network: "arb",
      uid: 42,
      memo: undefined,
      receivePrivately: false,
    });
  });

  it("encodes private receive and memo", () => {
    const search = buildPaymentRequestSearch({
      address: "alice.near",
      amount: "10",
      token: "USDT",
      network: "near",
      uid: 7,
      memo: "invoice for trip",
      receivePrivately: true,
    });
    expect(parsePaymentRequestSearch(`?${search}`)).toEqual({
      addr: "alice.near",
      amount: "10",
      token: "USDT",
      network: "near",
      uid: 7,
      memo: "invoice for trip",
      receivePrivately: true,
    });
  });

  it("rejects missing or invalid fields", () => {
    expect(parsePaymentRequestSearch("")).toBeNull();
    expect(parsePaymentRequestSearch("addr=0x1&amount=1&token=USDC&network=arb&uid=0")).toBeNull();
    expect(parsePaymentRequestSearch("addr=0x1&amount=1&token=ETH&network=arb&uid=1")).toBeNull();
  });
});
