import { describe, expect, it } from "vitest";
import { unparseCsv } from "./csv";

describe("unparseCsv", () => {
  it("writes header and rows", () => {
    expect(
      unparseCsv([
        ["name", "amount"],
        ["Alice", "1"],
      ]),
    ).toBe("name,amount\r\nAlice,1");
  });
});
