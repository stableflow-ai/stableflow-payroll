import { describe, expect, it } from "vitest";
import { MULTISIG_WATCH_STATUS } from "../../multisig/types";
import {
  isSquadsProposalExecuted,
  isSquadsProposalTerminal,
  snapshotFromSquadsProposal,
  squadsProposalStatusKind,
} from "./watch";

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

describe("snapshotFromSquadsProposal", () => {
  it("uses approved count and threshold", () => {
    expect(snapshotFromSquadsProposal(1, 2, { __kind: "Active" })).toEqual({
      signed: 1,
      required: 2,
      status: MULTISIG_WATCH_STATUS.Pending,
      txHash: null,
    });
  });

  it("keeps Approved pending until Executed", () => {
    expect(snapshotFromSquadsProposal(2, 2, { __kind: "Approved" }).status).toBe(
      MULTISIG_WATCH_STATUS.Pending,
    );
    expect(isSquadsProposalExecuted({ __kind: "Executed" })).toBe(true);
    expect(snapshotFromSquadsProposal(2, 2, { __kind: "Executed" }).status).toBe(
      MULTISIG_WATCH_STATUS.Success,
    );
  });
});
