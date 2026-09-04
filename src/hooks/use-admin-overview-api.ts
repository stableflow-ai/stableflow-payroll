/**
 * TODO(api): mock data until the admin overview contract exists.
 * Replace with:
 *   1. types in src/types/<domain>.ts
 *   2. a function in src/api/<domain>.ts
 *   3. a key in src/api/query-keys.ts
 *   4. queryFn -> the real api function
 *   5. delete src/mocks/admin-overview.ts and its MOCK_ENABLED entry
 */
import { useQuery } from "@tanstack/react-query";
import { MOCK_ENABLED } from "@/mocks/config";
import { getAdminOverview } from "@/mocks/admin-overview";
import { useAuthStore } from "@/stores/auth";

export type {
  AdminHighPriorityItem,
  AdminHighPriorityKind,
  AdminOverview,
  AdminOverviewChartPoint,
} from "@/mocks/admin-overview";
export { ADMIN_HIGH_PRIORITY_KIND } from "@/mocks/admin-overview";

const ADMIN_OVERVIEW_KEY = ["admin-overview"] as const;

export function useAdminOverviewQuery() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ADMIN_OVERVIEW_KEY,
    queryFn: () => getAdminOverview(),
    enabled: Boolean(token) && MOCK_ENABLED.adminOverview,
  });
}
