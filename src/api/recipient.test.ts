import { describe, expect, it } from "vitest";
import { mapRecipient } from "./recipient";

describe("mapRecipient", () => {
  it("maps address to wallet and numeric id to string", () => {
    expect(
      mapRecipient({
        id: 4,
        name: "Ada",
        address: "0xabc",
        email: "ada@example.com",
      }),
    ).toEqual({
      id: "4",
      name: "Ada",
      wallet: "0xabc",
      email: "ada@example.com",
    });
  });

  it("treats a blank email as missing and still reads wallet", () => {
    expect(mapRecipient({ id: 1, name: "Ada", wallet: "0xdef", email: "  " })).toEqual({
      id: "1",
      name: "Ada",
      wallet: "0xdef",
      email: null,
    });
  });
});
