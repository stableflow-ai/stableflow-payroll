import * as squads from "@sqds/multisig";
import { PublicKey } from "@solana/web3.js";

type MemberLike = {
  key: PublicKey;
  permissions: { mask: number };
};

export type MemberProposalAccess = "ok" | "not-member" | "no-initiate";

export function memberProposalAccess(
  members: readonly MemberLike[],
  member: string,
): MemberProposalAccess {
  const address = member.trim();
  if (!address) return "not-member";
  const row = members.find((item) => item.key.toBase58() === address);
  if (!row) return "not-member";
  return squads.types.Permissions.has(row.permissions, squads.types.Permission.Initiate)
    ? "ok"
    : "no-initiate";
}
