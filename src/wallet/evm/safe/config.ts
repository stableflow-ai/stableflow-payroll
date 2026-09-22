/** wagmi connector id registered by the Safe App (iframe) connector. */
export const SAFE_CONNECTOR_ID = "safe";

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

export const SAFE_PROPOSAL_CONFIRM_MESSAGE = "Confirm this transaction in your Safe";
export const SAFE_PROPOSAL_SUBMITTED_MESSAGE = "Transaction proposed to your Safe";
export const SAFE_PROPOSAL_QUEUE_LINK_LABEL = "Review it in your Safe queue";
export const SAFE_REQUEST_EXPIRED_MESSAGE =
  "Wallet request expired. Confirm again in your wallet.";
export const SAFE_CLIENT_GATEWAY_URL = "https://safe-client.safe.global";
export const SAFE_PROPOSAL_POLL_MS = 15_000;
