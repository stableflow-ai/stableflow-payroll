/**
 * DAO account state read straight from the contract.
 *
 * Never cached: threshold and members change through role management, and the
 * Multisig m/n badge has to reflect the live values.
 */

import { nearViewFunction } from "@/lib/rpc/near";
import { parseDaoInfo } from "./policy";
import type { NearDaoInfo, Policy } from "./types";

export async function getNearDaoInfo(daoId: string): Promise<NearDaoInfo> {
  const id = daoId.trim();
  if (!id) throw new Error("Missing DAO account");
  const policy = await nearViewFunction<Policy>(id, "get_policy");
  if (!policy || !Array.isArray(policy.roles)) {
    throw new Error(`Account ${id} is not a SputnikDAO`);
  }
  const info = parseDaoInfo(id, policy);
  if (!info) throw new Error(`DAO ${id} has no FunctionCall approver group`);
  return info;
}
