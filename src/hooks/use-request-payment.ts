import { MOCK_ENABLED } from "@/mocks/config";
import { getPendingWithdrawCount, getReceivedPayments } from "@/mocks/request-payment";

// TODO(api): replace mock read with TanStack Query when the backend contract is ready.
// 1. Add types in src/types/request-payment.ts from the real API (do not reuse mock-local types blindly).
// 2. Add src/api/request-payment.ts using http() and append the endpoint table in doc/api.md.
//    Expected paths:
//    - GET received-payment list (path TBD)
//    - GET pending-withdraw count (separate endpoint, do not derive from the list)
//    - POST /v1/pay/request/received/:id/withdraw/submit — signedData → submit-intent → poll → update row
// 3. Add queryKeys.request in src/api/query-keys.ts.
// 4. Switch this hook to useQuery ({ enabled: Boolean(token), queryFn: real api }).
// 5. Set MOCK_ENABLED.request = false and delete src/mocks/request-payment.ts.
export function useRequestPayment() {
  if (!MOCK_ENABLED.request) {
    throw new Error("Request payment mock is disabled. Wire TanStack Query before turning MOCK_ENABLED.request off.");
  }
  return {
    received: getReceivedPayments(),
    pendingWithdrawCount: getPendingWithdrawCount(),
  };
}
