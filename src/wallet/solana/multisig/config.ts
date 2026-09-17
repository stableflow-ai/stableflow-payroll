import { PublicKey } from "@solana/web3.js";

/** Squads Protocol v4 program. Same address on mainnet and devnet. */
export const SQUADS_V4_PROGRAM_ID = new PublicKey("SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf");

export const SQUADS_X_WALLET_NAME_PATTERN = /squads\s*x/i;

export const FUSE_GET_EPHEMERAL_SIGNERS_FEATURE = "fuse:getEphemeralSigners";

export const SQUADS_APP_TRANSACTIONS_URL = "https://app.squads.so/squads/{vaultAddress}/transactions";

export const SQUADS_PROPOSAL_SUBMITTED_MESSAGE = "Transaction proposed to your Squads treasury";
export const SQUADS_PROPOSAL_QUEUE_LINK_LABEL = "Review it in your Squads queue";

export const SQUADS_INFO_SIGNATURE_LIMIT = 25;
export const SQUADS_VAULT_INDEX_MAX = 8;
