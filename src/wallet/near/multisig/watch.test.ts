import { describe, expect, it } from "vitest";
import { MULTISIG_WATCH_STATUS } from "../../multisig/types";
import {
  isNearProposalApproved,
  isNearProposalTerminal,
  nearProposalApproveCount,
  nearProposalStatusKey,
  snapshotFromNearProposal,
} from "./watch";

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

describe("nearProposalApproveCount", () => {
  it("reads Approve weight for the payment role", () => {
    expect(nearProposalApproveCount({
      id: 1,
      kind: {},
      vote_counts: { Approver: ["2", "0", "0"] },
    }, "Approver")).toBe(2);
    expect(nearProposalApproveCount({
      id: 1,
      kind: {},
      vote_counts: { Approver: [1, 0, 0] },
    }, "Approver")).toBe(1);
    expect(nearProposalApproveCount({
      id: 1,
      kind: {},
      vote_counts: {},
    }, "Approver")).toBe(0);
  });
});

describe("snapshotFromNearProposal", () => {
  it("maps Approved to success without an on-chain hash", () => {
    expect(snapshotFromNearProposal({
      id: 1,
      kind: {},
      status: "Approved",
      vote_counts: { council: [2, 0, 0] },
    }, 3, "council")).toEqual({
      signed: 2,
      required: 3,
      status: MULTISIG_WATCH_STATUS.Success,
      txHash: null,
    });
  });

  it("keeps InProgress pending", () => {
    expect(snapshotFromNearProposal({
      id: 1,
      kind: {},
      status: { InProgress: {} },
      vote_counts: { council: [0, 0, 0] },
    }, 2, "council").status).toBe(MULTISIG_WATCH_STATUS.Pending);
  });
});

describe("isNearProposalApproved", () => {
  it("only treats Approved as success", () => {
    expect(isNearProposalApproved("Approved")).toBe(true);
    expect(isNearProposalApproved("Rejected")).toBe(false);
  });
});
