import { useQuery } from "@tanstack/react-query";
import { MOCK_ENABLED } from "@/mocks/config";
import { getReimbursementOverviewMock } from "@/mocks/reimbursement";
import { useAuthStore } from "@/stores/auth";

/**
 * TODO(api): mock data until the reimbursement overview contract exists.
 * Replace with:
 *   1. types in src/types/reimbursement.ts
 *   2. a function in src/api/reimbursement.ts
 *   3. a key in src/api/query-keys.ts
 *   4. queryFn -> the real api function
 *   5. delete src/mocks/reimbursement.ts and its MOCK_ENABLED entry
 */
export function useReimbursementOverviewQuery() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["mock", "reimbursement", "overview"],
    queryFn: getReimbursementOverviewMock,
    enabled: Boolean(token) && MOCK_ENABLED.reimbursement,
  });
}
