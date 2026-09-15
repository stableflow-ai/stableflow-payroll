import { describe, expect, it } from "vitest";
import { buildSafeBundle } from "./bundle";

const TOKEN = "0x2222222222222222222222222222222222222222";
const CONTRACT = "0x3333333333333333333333333333333333333333";

describe("buildSafeBundle", () => {
  it("puts approvals before the main call and keeps the value on the main call", () => {
    expect(buildSafeBundle({
      approvals: ["0xaaaa"],
      tokenAddress: TOKEN,
      contract: CONTRACT,
      callData: "0xbbbb",
      value: 5n,
    })).toEqual([
      { to: TOKEN, data: "0xaaaa", value: 0n },
      { to: CONTRACT, data: "0xbbbb", value: 5n },
    ]);
  });

  it("passes approval calldata through verbatim rather than re-encoding it", () => {
    const approval = "0x095ea7b30000000000000000000000003333333333333333333333333333333333333333";
    const [first] = buildSafeBundle({
      approvals: [approval],
      tokenAddress: TOKEN,
      contract: CONTRACT,
      callData: "0xbbbb",
    });
    expect(first.data).toBe(approval);
  });

  it("skips blank approvals and defaults value to zero", () => {
    expect(buildSafeBundle({
      approvals: ["", "   "],
      tokenAddress: TOKEN,
      contract: CONTRACT,
      callData: "0xbbbb",
    })).toEqual([{ to: CONTRACT, data: "0xbbbb", value: 0n }]);
  });

  it("adds the 0x prefix when the backend omits it", () => {
    const [only] = buildSafeBundle({ contract: CONTRACT, callData: "bbbb" });
    expect(only.data).toBe("0xbbbb");
  });

  it("refuses an approval without a token contract to send it to", () => {
    expect(() => buildSafeBundle({
      approvals: ["0xaaaa"],
      contract: CONTRACT,
      callData: "0xbbbb",
    })).toThrow("Missing origin token contract");
  });

  it("refuses an empty main call", () => {
    expect(() => buildSafeBundle({ contract: CONTRACT, callData: "  " })).toThrow("Missing call data");
  });
});
