import { MOCK_ENABLED } from "@/mocks/config";
import { getPartnerReports, type PartnerReports } from "@/mocks/partner";

export type { PartnerReports };

// TODO(api): replace mock read with TanStack Query when the backend contract is ready.
// 1. Add types in src/types/partner.ts from the real API (do not reuse mock-local types blindly).
// 2. Add src/api/partner.ts using http() and append the endpoint table in doc/api.md.
// 3. Add queryKeys.partner in src/api/query-keys.ts.
// 4. Switch this hook to useQuery ({ enabled: Boolean(token), queryFn: real api }).
// 5. Set MOCK_ENABLED.partner = false and delete src/mocks/partner.ts.
export function usePartnerReports(): PartnerReports {
  if (!MOCK_ENABLED.partner) {
    throw new Error(
      "Partner mock is disabled. Wire TanStack Query before turning MOCK_ENABLED.partner off.",
    );
  }
  return getPartnerReports();
}
