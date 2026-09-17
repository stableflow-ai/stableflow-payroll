import { describe, expect, it } from "vitest";
import { isNearProposalTerminal, nearProposalStatusKey } from "./watch";

describe("nearProposalStatusKey", () => {
  it("reads a string or a serde object", () => {
    expect(nearProposalStatusKey("InProgress")).toBe("InProgress");
    expect(nearProposalStatusKey({ Approved: {} })).toBe("Approved");
    expect(nearProposalStatusKey(null)).toBe("");
  });
});

describe("isNearProposalTerminal", () => {
  it("leaves InProgress pending", () => {
    expect(isNearProposalTerminal("InProgress")).toBe(false);
    expect(isNearProposalTerminal({ InProgress: {} })).toBe(false);
    expect(isNearProposalTerminal("Approved")).toBe(true);
    expect(isNearProposalTerminal({ Rejected: {} })).toBe(true);
    expect(isNearProposalTerminal("Expired")).toBe(true);
  });
});
