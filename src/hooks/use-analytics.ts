import { MOCK_ENABLED } from "@/mocks/config";
import {
  getAnalytics,
  type VolumeRange,
} from "@/mocks/analytics";

// TODO(api): replace mock read with TanStack Query when the backend contract is ready.
// 1. Add types in src/types/<domain>.ts from the real API (do not reuse mock-local types blindly).
// 2. Add src/api/<domain>.ts using http() and append the endpoint table in doc/api.md.
// 3. Add queryKeys.<domain> in src/api/query-keys.ts.
// 4. Switch this hook to useQuery ({ enabled: Boolean(token), queryFn: real api }).
// 5. Set MOCK_ENABLED.<domain> = false and delete src/mocks/<domain>.ts.
export function useAnalytics(month: string, range: VolumeRange) {
  if (!MOCK_ENABLED.analytics) {
    throw new Error(
      "Analytics mock is disabled. Wire TanStack Query before turning MOCK_ENABLED.analytics off.",
    );
  }
  return getAnalytics({ month, range });
}
