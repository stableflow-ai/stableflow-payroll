/**
 * Types for the Solana Squads v4 / SquadsX multisig integration.
 *
 * SquadsX reports the vault PDA as the connected address, so payer / refundTo /
 * balance owner need no remapping — the same shape as a connected Safe.
 */

export type SquadsMode = "squadsx";

export interface SquadsAccountInfo {
  vaultAddress: string;
  multisigPda: string;
  /** Approvals required to execute a vault transaction. */
  threshold: number;
  members: string[];
}
