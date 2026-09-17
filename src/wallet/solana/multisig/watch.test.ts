import { describe, expect, it } from "vitest";
import { isSquadsProposalTerminal, squadsProposalStatusKind } from "./watch";

describe("squadsProposalStatusKind", () => {
  it("reads __kind or a serde object key", () => {
    expect(squadsProposalStatusKind({ __kind: "Active" })).toBe("Active");
    expect(squadsProposalStatusKind({ Executed: {} })).toBe("Executed");
    expect(squadsProposalStatusKind("Approved")).toBe("Approved");
  });
});

describe("isSquadsProposalTerminal", () => {
  it("treats executed, rejected, and cancelled as terminal", () => {
    expect(isSquadsProposalTerminal({ __kind: "Executed" })).toBe(true);
    expect(isSquadsProposalTerminal({ __kind: "Rejected" })).toBe(true);
    expect(isSquadsProposalTerminal({ __kind: "Cancelled" })).toBe(true);
    expect(isSquadsProposalTerminal({ __kind: "Approved" })).toBe(false);
    expect(isSquadsProposalTerminal({ __kind: "Active" })).toBe(false);
  });
});
