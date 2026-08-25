/**
 * Payer settlement for a request-payment link lives on Single Payout.
 * The link is `/pay?id=<requestId>`. The payer loads `GET /v1/pay/request/{id}`
 * and quote/swap send `request_id`.
 */
export {};
