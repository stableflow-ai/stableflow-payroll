/**
 * Types for the Solana Squads v4 integration.
 *
 * SquadsX reports the vault PDA as the connected address, so payer / refundTo /
 * balance owner need no remapping. The SDK path connects a member keypair and
 * remaps those fields to the bound vault.
 */

export type SquadsMode = "squadsx" | "sdk";

export interface SquadsAccountInfo {
  vaultAddress: string;
  multisigPda: string;
  vaultIndex: number;
  /** Approvals required to execute a vault transaction. */
  threshold: number;
  members: string[];
  canInitiate: boolean;
}

export type SquadsSdkBinding = {
  member: string;
  vaultAddress: string;
  multisigPda: string;
  vaultIndex: number;
};
