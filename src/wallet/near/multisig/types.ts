/**
 * Types for the NEAR SputnikDAO / Trezu multisig integration.
 *
 * Trezu's connector returns the DAO account itself, so payer / refundTo /
 * balance owner need no remapping — the same shape as a connected Safe.
 *
 * JSON matches `get_policy` on the contract (serde untagged), not Trezu's
 * tagged internal proposal-API types.
 */

export type NearMultisigMode = "trezu" | "onchain";

export interface NearDaoInfo {
  daoId: string;
  /** Approvals required to pass a FunctionCall proposal. */
  threshold: number;
  members: string[];
  roleName: string;
}

export type RoleKind =
  | "Everyone"
  | { Member: string }
  | { Group: string[] };

export type WeightOrRatio =
  | string
  | [number, number];

export type WeightKind = "TokenWeight" | "RoleWeight";

export interface VotePolicy {
  weight_kind: WeightKind;
  quorum: string;
  threshold: WeightOrRatio;
}

export interface RolePermission {
  name: string;
  kind: RoleKind;
  permissions: string[];
  vote_policy: Record<string, VotePolicy>;
}

export interface Policy {
  roles: RolePermission[];
  default_vote_policy: VotePolicy;
  proposal_bond: string;
  proposal_period: string;
  bounty_bond: string;
  bounty_forgiveness_period: string;
}

export interface FunctionCallAction {
  method_name: string;
  args?: string;
  gas?: string;
  deposit?: string;
}

export type SputnikProposalKind = {
  FunctionCall?: {
    receiver_id: string;
    actions: FunctionCallAction[];
  };
  Transfer?: {
    receiver_id: string;
    amount: string;
    token_id?: string;
    msg?: string | null;
  };
};

export interface SputnikProposal {
  id: number;
  kind: SputnikProposalKind;
  status?: unknown;
  /** Role → [Approve, Reject, Remove] weights from `get_proposal`. */
  vote_counts?: Record<string, unknown>;
  votes?: Record<string, unknown>;
}

export interface ProposalMatchSpec {
  receiverId: string;
  methodNames: string[];
}
