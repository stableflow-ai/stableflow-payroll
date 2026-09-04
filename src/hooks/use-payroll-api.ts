import { useQuery } from "@tanstack/react-query";
import { MOCK_ENABLED } from "@/mocks/config";
import { getPayrollOverviewMock } from "@/mocks/payroll";
import { useAuthStore } from "@/stores/auth";
import {
  PAYROLL_MOCK_VARIANT,
  type PayrollMockVariant,
} from "@/views/payroll/config";

/**
 * TODO(api): mock data until the payroll overview contract exists.
 * Replace with:
 *   1. types in src/types/payroll.ts
 *   2. a function in src/api/payroll.ts
 *   3. a key in src/api/query-keys.ts
 *   4. queryFn -> the real api function
 *   5. delete src/mocks/payroll.ts and its MOCK_ENABLED entry
 */
export function usePayrollOverviewQuery(
  variant: PayrollMockVariant = PAYROLL_MOCK_VARIANT.Empty,
) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["mock", "payroll", "overview", variant],
    queryFn: () => getPayrollOverviewMock(variant),
    enabled: Boolean(token) && MOCK_ENABLED.payroll,
    placeholderData: (previous) => previous,
  });
}
