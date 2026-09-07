import { useQuery } from "@tanstack/react-query";
import { getMemberOverview, getMemberOverviewPayout } from "@/api/overview";
import { queryKeys } from "@/api/query-keys";
import { organizationId } from "@/lib/auth-role";
import { useAuthStore } from "@/stores/auth";
import type { VolumePeriod } from "@/types/payout";
import { browserTimeZone } from "@/utils";

export {
  EMPLOYEE_PAYMENT_TYPE,
  type EmployeePaymentType,
  type MemberOpenRequest,
  type MemberOverviewPayoutPoint,
  type MemberOverviewStats,
  type MemberRecentPayment,
} from "@/types/overview";

function useMemberOrganizationScope() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const orgId = organizationId(user);
  return {
    orgId,
    enabled: Boolean(token) && orgId !== null,
  };
}

export function useMemberOverviewQuery() {
  const { orgId, enabled } = useMemberOrganizationScope();
  return useQuery({
    queryKey: queryKeys.memberOverview.stats(orgId ?? -1),
    queryFn: () => getMemberOverview(orgId!),
    enabled,
  });
}

export function useMemberOverviewPayoutQuery(period: VolumePeriod) {
  const { orgId, enabled } = useMemberOrganizationScope();
  const timezone = browserTimeZone();
  return useQuery({
    queryKey: queryKeys.memberOverview.payout(orgId ?? -1, period, timezone),
    queryFn: () =>
      getMemberOverviewPayout({
        organizationId: orgId!,
        period,
        timezone,
      }),
    enabled,
  });
}
