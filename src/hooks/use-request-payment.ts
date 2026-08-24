import { MOCK_ENABLED } from "@/mocks/config";
import { getRequestPayment } from "@/mocks/request-payment";

// TODO(api): replace mock read with TanStack Query when the backend contract is ready.
// 1. Add types in src/types/request-payment.ts from the real API (do not reuse mock-local types blindly).
// 2. Add src/api/request-payment.ts using http() and append the endpoint table in doc/api.md.
//    Expected paths:
//    - POST /v1/pay/request — create a payment link (address, amount, token, description, receivePrivately)
//    - GET /v1/pay/request/:id — payer opens /pay?request=:id (not built this sprint)
//    - GET /v1/pay/request/received — Received Payment list
//    - POST /v1/pay/request/:id/pay or reuse quick/submit — payer settle (private uses CONFIDENTIAL_INTENTS)
//    - POST /v1/pay/request/received/:id/withdraw — backend quote + generate-intent, return unsigned payload
//    - POST /v1/pay/request/received/:id/withdraw/submit — signedData → submit-intent → poll → update row
// 3. Add queryKeys.request in src/api/query-keys.ts.
// 4. Switch this hook to useQuery ({ enabled: Boolean(token), queryFn: real api }).
// 5. Set MOCK_ENABLED.request = false and delete src/mocks/request-payment.ts.
export function useRequestPayment() {
  if (!MOCK_ENABLED.request) {
    throw new Error("Request payment mock is disabled. Wire TanStack Query before turning MOCK_ENABLED.request off.");
  }
  return getRequestPayment();
}
