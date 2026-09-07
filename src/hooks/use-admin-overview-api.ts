import { useQuery } from "@tanstack/react-query";
import {
  getOrganizationHighPriority,
  getOrganizationOverview,
  getOrganizationPayout,
} from "@/api/organization";
import { queryKeys } from "@/api/query-keys";
import { organizationId } from "@/lib/auth-role";
import { useAuthStore } from "@/stores/auth";
import type { VolumePeriod } from "@/types/payout";
import { browserTimeZone } from "@/utils";

function useOrganizationScope() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const orgId = organizationId(user);
  return {
    orgId,
    enabled: Boolean(token) && orgId !== null,
  };
}

export function useOrganizationOverviewQuery() {
  const { orgId, enabled } = useOrganizationScope();
  return useQuery({
    queryKey: queryKeys.organization.overview(orgId ?? -1),
    queryFn: () => getOrganizationOverview(orgId!),
    enabled,
  });
}

export function useOrganizationPayoutQuery(period: VolumePeriod) {
  const { orgId, enabled } = useOrganizationScope();
  const timezone = browserTimeZone();
  return useQuery({
    queryKey: queryKeys.organization.payout(orgId ?? -1, period, timezone),
    queryFn: () =>
      getOrganizationPayout({
        organizationId: orgId!,
        period,
        timezone,
      }),
    enabled,
  });
}

export function useOrganizationHighPriorityQuery() {
  const { orgId, enabled } = useOrganizationScope();
  const timezone = browserTimeZone();
  return useQuery({
    queryKey: queryKeys.organization.highPriority(orgId ?? -1, timezone),
    queryFn: () =>
      getOrganizationHighPriority({
        organizationId: orgId!,
        timezone,
      }),
    enabled,
  });
}
