import { describe, expect, it } from "vitest";
import { privateAvailableForToken, type PrivateBalance } from "./one-click-auth";

const BALANCES: PrivateBalance[] = [
  {
    tokenId: "nep141:arb-0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9.omft.near",
    available: "5033",
    source: "private",
  },
  {
    tokenId: "nep245:v2_1.omni.hot.tg:56_2w93GqMcEmQFDru84j3HZZWt557r",
    available: "10000000000000000",
    source: "private",
  },
];

describe("privateAvailableForToken", () => {
  it("reads the private available amount for a tokenId", () => {
    expect(
      privateAvailableForToken(BALANCES, "nep245:v2_1.omni.hot.tg:56_2w93GqMcEmQFDru84j3HZZWt557r"),
    ).toBe("10000000000000000");
  });

  it("returns 0 when the token is missing", () => {
    expect(privateAvailableForToken(BALANCES, "nep141:missing")).toBe("0");
  });
});
