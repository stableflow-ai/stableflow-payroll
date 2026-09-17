/**
 * Shared snapshot for every chain's multisig execution watcher.
 *
 * New chain adapters implement `watch*` so it reports this shape. UI and
 * submit logic stay chain-agnostic. See doc/multisig.md.
 */

export const MULTISIG_WATCH_STATUS = {
  Pending: "pending",
  Success: "success",
  Failed: "failed",
} as const;

export type MultisigWatchStatus =
  (typeof MULTISIG_WATCH_STATUS)[keyof typeof MULTISIG_WATCH_STATUS];

export type MultisigWatchSnapshot = {
  /** Approvals already collected. `null` when the chain cannot report n. */
  signed: number | null;
  /** Approvals required to pass. `null` when the chain cannot report m. */
  required: number | null;
  status: MultisigWatchStatus;
  /** On-chain execution hash only. Not a Safe tx hash or proposal id. */
  txHash: string | null;
};

export type MultisigConfirmCopy = {
  url: string | null;
  title: string;
  label: string;
};
