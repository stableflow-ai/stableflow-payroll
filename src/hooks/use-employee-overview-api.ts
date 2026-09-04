/**
 * TODO(api): mock data until the employee overview contract exists.
 * Replace with:
 *   1. types in src/types/<domain>.ts
 *   2. a function in src/api/<domain>.ts
 *   3. a key in src/api/query-keys.ts
 *   4. queryFn -> the real api function
 *   5. delete src/mocks/employee-overview.ts and its MOCK_ENABLED entry
 */
import { useQuery } from "@tanstack/react-query";
import { MOCK_ENABLED } from "@/mocks/config";
import { getEmployeeOverview } from "@/mocks/employee-overview";
import { useAuthStore } from "@/stores/auth";

export type {
  EmployeeOpenRequest,
  EmployeeOverview,
  EmployeeOverviewVolumePoint,
  EmployeePaymentType,
  EmployeeRecentPayment,
} from "@/mocks/employee-overview";
export { EMPLOYEE_PAYMENT_TYPE } from "@/mocks/employee-overview";

const EMPLOYEE_OVERVIEW_KEY = ["employee-overview"] as const;

export function useEmployeeOverviewQuery() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: EMPLOYEE_OVERVIEW_KEY,
    queryFn: () => getEmployeeOverview(),
    enabled: Boolean(token) && MOCK_ENABLED.employeeOverview,
  });
}
