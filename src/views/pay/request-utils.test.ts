import { describe, expect, it } from "vitest";
import { receivingAddressError } from "./request-utils";

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
