/**
 * Parse SputnikDAO `get_policy()` into m-of-n for the FunctionCall vote.
 *
 * Role names are not hardcoded: mainnet DAOs use council / Council / Approver /
 * Create Requests and others. WeightOrRatio is serde-untagged — a string is an
 * absolute vote count, a two-element array is a ratio whose conversion is
 * `num * total / denom + 1` (see sputnikdao2 `policy.rs`).
 */

import type {
  NearDaoInfo,
  Policy,
  RoleKind,
  RolePermission,
  VotePolicy,
  WeightOrRatio,
} from "./types";

function groupMembers(kind: RoleKind): string[] | null {
  if (typeof kind === "object" && kind !== null && "Group" in kind && Array.isArray(kind.Group)) {
    return kind.Group;
  }
  return null;
}

function permissionAllowsFunctionCallVoteApprove(permission: string): boolean {
  const sep = permission.indexOf(":");
  if (sep < 0) return false;
  const kind = permission.slice(0, sep);
  const action = permission.slice(sep + 1);
  const kindOk = kind === "*" || kind === "FunctionCall";
  const actionOk = action === "*" || action === "VoteApprove";
  return kindOk && actionOk;
}

function roleCanVoteApproveFunctionCall(role: RolePermission): boolean {
  return role.permissions.some(permissionAllowsFunctionCallVoteApprove);
}

/** Convert a policy threshold into an absolute vote count for `total` members. */
export function thresholdToWeight(threshold: WeightOrRatio, total: number): number {
  if (total <= 0) return 0;
  if (typeof threshold === "string") {
    const weight = Number(threshold);
    if (!Number.isFinite(weight)) return total;
    return Math.min(weight, total);
  }
  if (!Array.isArray(threshold) || threshold.length < 2) return total;
  const [num, denom] = threshold;
  if (!Number.isFinite(num) || !Number.isFinite(denom) || denom === 0) return total;
  return Math.min(Math.floor((num * total) / denom) + 1, total);
}

function voteCount(policy: VotePolicy, memberCount: number): number {
  const quorum = Number(policy.quorum);
  const fromThreshold = thresholdToWeight(policy.threshold, memberCount);
  const fromQuorum = Number.isFinite(quorum) ? quorum : 0;
  return Math.min(Math.max(fromQuorum, fromThreshold), memberCount);
}

function pickApproverRole(policy: Policy): RolePermission | null {
  const matches = policy.roles.filter((role) => {
    return groupMembers(role.kind) !== null && roleCanVoteApproveFunctionCall(role);
  });
  if (matches.length === 0) return null;
  const withFunctionCallPolicy = matches.find((role) => role.vote_policy.FunctionCall);
  return withFunctionCallPolicy ?? matches[0];
}

export function parseDaoInfo(daoId: string, policy: Policy): NearDaoInfo | null {
  const role = pickApproverRole(policy);
  if (!role) return null;
  const members = groupMembers(role.kind);
  if (!members || members.length === 0) return null;
  const votePolicy = role.vote_policy.FunctionCall ?? policy.default_vote_policy;
  return {
    daoId,
    threshold: voteCount(votePolicy, members.length),
    members: [...members],
    roleName: role.name,
  };
}
