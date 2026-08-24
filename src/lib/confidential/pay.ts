/**
 * TODO(api): payer flow for a payment-request link is not implemented this
 * sprint. Do not change Login / Register / guards yet.
 *
 * When `GET /v1/pay/request/:id` exists:
 * - Payer URL: `/pay?request=:id`. Must be logged in. Unauthenticated users go
 *   to `/login?returnTo=` (pathname + search) and return to this link.
 * - Both private and non-private pays stay on Single Payout. Prefill and lock
 *   receiving address / amount / dest token.
 * - Non-private: existing `quickQuote` / `swap` / `submit`.
 * - Private: `recipientType: CONFIDENTIAL_INTENTS` (not the current
 *   `PayQuickQuoteParam`). This helper should wrap that quote + settle path.
 *
 * Known follow-ups (do not change this sprint):
 * - RequireAuth currently drops search.
 * - LoginView / RedirectIfAuthed hard-code navigate to `/`.
 */
export async function payConfidentialRequest(): Promise<never> {
  throw new Error("TODO(api): confidential request payment is not available yet");
}
