/**
 * Build the meta-transaction list for one Safe proposal.
 *
 * A Safe bundles several calls into one atomic MultiSend, which is what lets the
 * approval and the batch call land together and makes the EOA path's
 * approve → wait → re-read allowance dance unnecessary.
 */

import type { Address, Hex } from "viem";
import { SAFE_MISSING_APPROVAL_TOKEN_MESSAGE, SAFE_MISSING_CALL_DATA_MESSAGE } from "./config";
import type { SafeMetaTx } from "./types";

function toHexData(callData: string): Hex {
  const trimmed = callData.trim();
  if (!trimmed) throw new Error(SAFE_MISSING_CALL_DATA_MESSAGE);
  if (trimmed.startsWith("0x") || trimmed.startsWith("0X")) return trimmed as Hex;
  return `0x${trimmed}` as Hex;
}

/**
 * `[...approvals, mainCall]`.
 *
 * Approval calldata is passed through from the backend's `tx.approvals` verbatim:
 * it encodes a fixed allowance, and re-encoding it here would risk widening that
 * to an unbounded approval for the batch contract.
 */
export function buildSafeBundle(input: {
  approvals?: readonly string[];
  /** ERC-20 the approvals target. Required only when there are approvals. */
  tokenAddress?: string;
  contract: string;
  callData: string;
  value?: bigint;
}): SafeMetaTx[] {
  const txs: SafeMetaTx[] = [];

  for (const approval of input.approvals ?? []) {
    if (!approval.trim()) continue;
    const token = input.tokenAddress?.trim();
    if (!token) throw new Error(SAFE_MISSING_APPROVAL_TOKEN_MESSAGE);
    txs.push({ to: token as Address, data: toHexData(approval), value: 0n });
  }

  txs.push({
    to: input.contract.trim() as Address,
    data: toHexData(input.callData),
    value: input.value ?? 0n,
  });

  return txs;
}
