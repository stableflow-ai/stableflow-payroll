import { describe, expect, it } from "vitest";
import {
  matchSpecFromActions,
  pickMatchingProposal,
  proposalMatches,
} from "./proposal";
import type { SputnikProposal } from "./types";

const expected = {
  receiverId: "usdc.near",
  methodNames: ["storage_deposit", "ft_transfer"],
};

function proposal(id: number, kind: SputnikProposal["kind"]): SputnikProposal {
  return { id, kind };
}

describe("matchSpecFromActions", () => {
  it("keeps the receiver and FunctionCall method names in order", () => {
    expect(matchSpecFromActions({
      receiverId: "usdc.near",
      actions: [
        { params: { methodName: "storage_deposit" } },
        { params: { methodName: "ft_transfer" } },
      ],
    })).toEqual(expected);
  });
});

describe("proposalMatches", () => {
  it("matches FunctionCall by receiver and method set, ignoring args", () => {
    const row = proposal(4, {
      FunctionCall: {
        receiver_id: "usdc.near",
        actions: [
          { method_name: "storage_deposit", args: "aaaa" },
          { method_name: "ft_transfer", args: "bbbb" },
        ],
      },
    });
    expect(proposalMatches(row, expected)).toBe(true);
  });

  it("rejects a different receiver or missing method", () => {
    expect(proposalMatches(proposal(1, {
      FunctionCall: {
        receiver_id: "wrap.near",
        actions: [
          { method_name: "storage_deposit" },
          { method_name: "ft_transfer" },
        ],
      },
    }), expected)).toBe(false);

    expect(proposalMatches(proposal(1, {
      FunctionCall: {
        receiver_id: "usdc.near",
        actions: [{ method_name: "ft_transfer" }],
      },
    }), expected)).toBe(false);
  });

  it("does not match Transfer kinds", () => {
    expect(proposalMatches(proposal(1, {
      Transfer: { receiver_id: "usdc.near", amount: "1" },
    }), expected)).toBe(false);
  });
});

describe("pickMatchingProposal", () => {
  it("uses get_last_proposal_id as the next id: new proposals start at fromIndex", () => {
    const nextId = 3;
    const existing = [
      proposal(1, {
        FunctionCall: {
          receiver_id: "usdc.near",
          actions: [{ method_name: "ft_transfer" }],
        },
      }),
      proposal(2, {
        FunctionCall: {
          receiver_id: "other.near",
          actions: [{ method_name: "ft_transfer" }],
        },
      }),
    ];
    expect(pickMatchingProposal(existing, expected)).toBeNull();

    const afterSubmit = [
      ...existing.filter((row) => row.id >= nextId),
      proposal(3, {
        FunctionCall: {
          receiver_id: "usdc.near",
          actions: [
            { method_name: "storage_deposit" },
            { method_name: "ft_transfer" },
          ],
        },
      }),
    ];
    expect(pickMatchingProposal(afterSubmit, expected)?.id).toBe(3);
  });

  it("picks the matching proposal among concurrent ones by kind, not by being last", () => {
    const rows = [
      proposal(10, {
        FunctionCall: {
          receiver_id: "wrap.near",
          actions: [{ method_name: "ft_transfer" }],
        },
      }),
      proposal(11, {
        FunctionCall: {
          receiver_id: "usdc.near",
          actions: [
            { method_name: "storage_deposit" },
            { method_name: "ft_transfer" },
          ],
        },
      }),
      proposal(12, {
        FunctionCall: {
          receiver_id: "usdc.near",
          actions: [{ method_name: "ft_transfer" }],
        },
      }),
    ];
    expect(pickMatchingProposal(rows, expected)?.id).toBe(11);
  });
});
