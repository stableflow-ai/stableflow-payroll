/** wagmi connector id registered by the Safe App (iframe) connector. */
export const SAFE_CONNECTOR_ID = "safe";

/**
 * Block span per `eth_getLogs` request. Deliberately conservative: the signed RPC
 * proxy has not been measured yet and a rejected range would stall the whole scan.
 * Raise it once the per-chain limits are known.
 */
export const SAFE_LOG_SCAN_CHUNK_BLOCKS = 2_000n;

/**
 * Upper bound on chunks fetched per probe so a long backlog cannot block one
 * poll. Reaching the bound yields `pending`, never `cancelled`.
 */
export const SAFE_LOG_SCAN_MAX_CHUNKS = 10;

/**
 * Blocks subtracted from the head when recording a proposal's scan floor. Guards
 * against a slightly stale head from the RPC; the only cost is a few extra blocks.
 */
export const SAFE_SEND_BLOCK_MARGIN = 5n;

/** How often the pending-proposal poller re-probes each record. */
export const SAFE_PENDING_POLL_MS = 15_000;

/** Backoff ceiling after repeated probe failures, so one bad RPC cannot spin. */
export const SAFE_PENDING_MAX_BACKOFF_MS = 4 * 60_000;

export const SAFE_UNSUPPORTED_CHAIN_MESSAGE = "Unsupported EVM chain for Safe";
export const SAFE_NOT_CONNECTED_MESSAGE = "Connect your Safe to send this payout";
export const SAFE_MISSING_CALL_DATA_MESSAGE = "Missing call data";
export const SAFE_MISSING_APPROVAL_TOKEN_MESSAGE = "Missing origin token contract for approval";

/**
 * A Safe is bound to one chain and cannot be switched, so the origin chain has to
 * match the connected Safe instead of prompting a network change.
 */
export const SAFE_CHAIN_MISMATCH_MESSAGE =
  "Your Safe is on a different network. Switch the paying network in your Safe, then take a fresh quote.";

/** The Safe cannot batch, so an approval and the payout cannot share one proposal. */
export const SAFE_TWO_STEP_APPROVAL_MESSAGE =
  "This Safe cannot batch calls, so the approval needs its own signature round.";

/** The fallback proposed the approval by itself; the payout still has to be redone. */
export const SAFE_APPROVAL_PROPOSED_MESSAGE =
  "Your Safe cannot batch calls, so only the token approval was proposed. Sign it in your Safe, then pay again with a fresh quote. Nothing was paid yet.";

export const SAFE_UNTRACKABLE_SUBMISSION_MESSAGE =
  "Your Safe accepted the transaction but returned an id this page cannot track. Check the transaction in your Safe before paying again.";

export const SAFE_AWAITING_SIGNATURES_TITLE = "Transaction proposed to your Safe";

export function safeAwaitingSignaturesMessage(threshold: number): string {
  if (threshold <= 1) return "Confirm it in your Safe to finish this payout.";
  return `It needs ${threshold} signatures. Collect them in your Safe and this page will finish the payout automatically.`;
}

export const SAFE_PROPOSAL_REPLACED_MESSAGE =
  "That Safe transaction was replaced or rejected. Nothing was paid. Take a fresh quote to try again.";

export const SAFE_PROPOSAL_FAILED_MESSAGE =
  "That Safe transaction failed on-chain. Take a fresh quote to try again.";

/**
 * The quote's deposit address goes inactive, but 1Click keeps refunding to
 * `refundTo` (the Safe itself) for a while after, so an late execution loses the
 * payout rather than the funds.
 */
export const SAFE_QUOTE_EXPIRED_MESSAGE =
  "This quote expired while waiting for signatures. Reject it in your Safe — if it still executes, the funds are refunded to the Safe and you will need a fresh quote.";
