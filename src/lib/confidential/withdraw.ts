/**
 * TODO(api): recipient withdraw is not implemented this sprint (no Partner-key
 * product API). Do not call 1Click quote / generate-intent / submit-intent from
 * the browser. Partner `X-API-Key` must stay on our backend.
 *
 * When `POST /v1/pay/request/received/:id/withdraw` exists, the frontend should:
 * 1. Optionally read `GET /v0/account/balances` with the User-Session to confirm
 *    the `tokenId` `source: private` balance arrived. Do not use balances to
 *    execute the withdraw.
 * 2. Ask our backend to `POST /v0/quote` (Partner key):
 *    - depositType: CONFIDENTIAL_INTENTS
 *    - recipientType: DESTINATION_CHAIN
 *    - recipient: the form Receiving Address
 *    - refundTo / refundType: intentsAccountId + CONFIDENTIAL_INTENTS
 *    - originAsset / destinationAsset: the same stablecoin
 *    - swapType: EXACT_OUTPUT or EXACT_INPUT
 *    - confidentiality: advanced
 * 3. Backend verifies the quote signature, then `POST /v0/generate-intent`
 *    (type: swap_transfer, signerId: intentsAccountId, standard by chain).
 *    Do not mutate the returned payload.
 * 4. Wallet `signMessage` that exact payload (not the empty-intents activate
 *    payload) and POST signedData to
 *    `/v1/pay/request/received/:id/withdraw/submit`.
 * 5. Backend `POST /v0/submit-intent`, poll `GET /v0/status?depositAddress=`,
 *    then mark the Received Payment withdrawn with the destination tx.
 *
 * Align with salary's CONFIDENTIAL_INTENTS → DESTINATION_CHAIN spend leg.
 * Intents SDK `processWithdrawal` is an alternative path; this product uses
 * 1Click like salary.
 */
export async function withdrawConfidentialPayment(): Promise<never> {
  throw new Error("TODO(api): withdraw is not available until the product API exists");
}
