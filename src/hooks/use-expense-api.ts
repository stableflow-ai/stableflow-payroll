import { useQuery } from "@tanstack/react-query";
import { MOCK_ENABLED } from "@/mocks/config";
import { getExpenseOverviewMock } from "@/mocks/expense";
import { useAuthStore } from "@/stores/auth";

/**
 * TODO(api): mock data until the expense overview contract exists.
 * Replace with:
 *   1. types in src/types/expense.ts
 *   2. a function in src/api/expense.ts
 *   3. a key in src/api/query-keys.ts
 *   4. queryFn -> the real api function
 *   5. delete src/mocks/expense.ts and its MOCK_ENABLED entry
 */
export function useExpenseOverviewQuery() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["mock", "expense", "overview"],
    queryFn: getExpenseOverviewMock,
    enabled: Boolean(token) && MOCK_ENABLED.expense,
  });
}
