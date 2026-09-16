import { describe, expect, it } from "vitest";
import { parseDaoInfo, thresholdToWeight } from "./policy";
import type { Policy, RolePermission } from "./types";

function role(input: Partial<RolePermission> & Pick<RolePermission, "name" | "kind">): RolePermission {
  return {
    permissions: [],
    vote_policy: {},
    ...input,
  };
}

function policy(roles: RolePermission[], threshold: Policy["default_vote_policy"]["threshold"] = [1, 2]): Policy {
  return {
    roles,
    default_vote_policy: {
      weight_kind: "RoleWeight",
      quorum: "0",
      threshold,
    },
    proposal_bond: "0",
    proposal_period: "0",
    bounty_bond: "0",
    bounty_forgiveness_period: "0",
  };
}

describe("thresholdToWeight", () => {
  it("caps an absolute weight at the group size", () => {
    expect(thresholdToWeight("3", 5)).toBe(3);
    expect(thresholdToWeight("9", 5)).toBe(5);
  });

  it("converts a 1/2 ratio the way policy.rs does", () => {
    expect(thresholdToWeight([1, 2], 2)).toBe(2);
    expect(thresholdToWeight([1, 2], 5)).toBe(3);
  });

  it("converts a 1/1 ratio to the whole group", () => {
    expect(thresholdToWeight([1, 1], 5)).toBe(5);
  });
});

describe("parseDaoInfo", () => {
  it("uses the Group that can VoteApprove FunctionCall, not a hardcoded role name", () => {
    const info = parseDaoInfo("demo.sputnik-dao.near", policy([
      role({
        name: "all",
        kind: "Everyone",
        permissions: ["*:AddProposal"],
      }),
      role({
        name: "Approver",
        kind: { Group: ["alice.near", "bob.near"] },
        permissions: ["FunctionCall:VoteApprove"],
      }),
    ]));
    expect(info).toEqual({
      daoId: "demo.sputnik-dao.near",
      threshold: 2,
      members: ["alice.near", "bob.near"],
      roleName: "Approver",
    });
  });

  it("accepts *:* and *:VoteApprove wildcards", () => {
    const starStar = parseDaoInfo("dao.near", policy([
      role({
        name: "council",
        kind: { Group: ["a.near"] },
        permissions: ["*:*"],
      }),
    ], "1"));
    expect(starStar?.threshold).toBe(1);
    expect(starStar?.roleName).toBe("council");

    const starVote = parseDaoInfo("dao.near", policy([
      role({
        name: "Create Requests",
        kind: { Group: ["a.near", "b.near", "c.near"] },
        permissions: ["*:VoteApprove"],
      }),
    ]));
    expect(starVote?.threshold).toBe(2);
    expect(starVote?.roleName).toBe("Create Requests");
  });

  it("ignores Everyone and Member roles even when they have vote permissions", () => {
    const info = parseDaoInfo("dao.near", policy([
      role({
        name: "all",
        kind: "Everyone",
        permissions: ["*:*"],
      }),
      role({
        name: "token-holders",
        kind: { Member: "1" },
        permissions: ["*:*"],
      }),
      role({
        name: "Council",
        kind: { Group: ["owner.near"] },
        permissions: ["FunctionCall:*"],
      }),
    ], "1"));
    expect(info?.roleName).toBe("Council");
    expect(info?.members).toEqual(["owner.near"]);
  });

  it("prefers a role that sets a FunctionCall vote policy", () => {
    const info = parseDaoInfo("dao.near", policy([
      role({
        name: "wide",
        kind: { Group: ["a.near", "b.near", "c.near", "d.near"] },
        permissions: ["*:VoteApprove"],
      }),
      role({
        name: "tight",
        kind: { Group: ["a.near", "b.near"] },
        permissions: ["FunctionCall:VoteApprove"],
        vote_policy: {
          FunctionCall: {
            weight_kind: "RoleWeight",
            quorum: "0",
            threshold: "2",
          },
        },
      }),
    ]));
    expect(info?.roleName).toBe("tight");
    expect(info?.threshold).toBe(2);
  });

  it("returns null when no Group can approve FunctionCall", () => {
    expect(parseDaoInfo("dao.near", policy([
      role({
        name: "all",
        kind: "Everyone",
        permissions: ["*:AddProposal"],
      }),
    ]))).toBeNull();
  });
});
