import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  exportBonusHistory,
  getBonusCurrentStats,
  getBonusHistory,
  getBonusOpen,
  getBonusRecentPayouts,
  getBonusTotalPayout,
  importBonuses,
} from "@/api/bonus";
import { queryKeys } from "@/api/query-keys";
import { organizationId } from "@/lib/auth-role";
import { useAuthStore } from "@/stores/auth";
import type { BonusTotalPayoutPeriod } from "@/types/bonus";
import { browserTimeZone } from "@/utils";
import { stampDownloadFilename } from "@/views/pay/utils";
import {
  BONUS_HISTORY_PAGE_SIZE,
  BONUS_RECENT_LIMIT_MAX,
  BONUS_RECENT_PAGE_SIZE,
} from "@/views/bonus/config";

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function useBonusQueryContext() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const orgId = organizationId(user);
  return {
    organizationId: orgId,
    timezone: browserTimeZone(),
    enabled: Boolean(token) && orgId !== null,
  };
}

export function useBonusCurrentStatsQuery() {
  const { organizationId: orgId, timezone, enabled } = useBonusQueryContext();
  return useQuery({
    queryKey: queryKeys.bonus.current(orgId ?? 0, timezone),
    queryFn: () =>
      getBonusCurrentStats({
        organizationId: orgId!,
        timezone,
      }),
    enabled,
  });
}

export function useBonusTotalPayoutQuery(period: BonusTotalPayoutPeriod) {
  const { organizationId: orgId, timezone, enabled } = useBonusQueryContext();
  return useQuery({
    queryKey: queryKeys.bonus.totalPayout(orgId ?? 0, period, timezone),
    queryFn: () =>
      getBonusTotalPayout({
        organizationId: orgId!,
        period,
        timezone,
      }),
    enabled,
  });
}

export function useBonusRecentPayoutsInfiniteQuery() {
  const { organizationId: orgId, enabled } = useBonusQueryContext();
  return useInfiniteQuery({
    queryKey: queryKeys.bonus.recent(orgId ?? 0),
    queryFn: async ({ pageParam }) => {
      const limit = pageParam * BONUS_RECENT_PAGE_SIZE;
      const rows = await getBonusRecentPayouts({
        organizationId: orgId!,
        limit,
      });
      return rows.slice((pageParam - 1) * BONUS_RECENT_PAGE_SIZE);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < BONUS_RECENT_PAGE_SIZE) return undefined;
      const loaded = allPages.reduce((count, page) => count + page.length, 0);
      if (loaded >= BONUS_RECENT_LIMIT_MAX) return undefined;
      return allPages.length + 1;
    },
    enabled,
  });
}

export function useBonusOpenQuery() {
  const { organizationId: orgId, enabled } = useBonusQueryContext();
  return useQuery({
    queryKey: queryKeys.bonus.open(orgId ?? 0),
    queryFn: () =>
      getBonusOpen({
        organizationId: orgId!,
      }),
    enabled,
  });
}

export function useBonusHistoryInfiniteQuery() {
  const { organizationId: orgId, enabled } = useBonusQueryContext();
  return useInfiniteQuery({
    queryKey: queryKeys.bonus.history(orgId ?? 0),
    queryFn: ({ pageParam }) =>
      getBonusHistory({
        organizationId: orgId!,
        page: pageParam,
        pageSize: BONUS_HISTORY_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.list.length < BONUS_HISTORY_PAGE_SIZE) return undefined;
      if (allPages.length >= lastPage.totalPage) return undefined;
      return allPages.length + 1;
    },
    enabled,
  });
}

export function useBonusImportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importBonuses,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.bonus.all });
    },
  });
}

export function useBonusHistoryExportMutation() {
  const { organizationId: orgId } = useBonusQueryContext();
  return useMutation({
    mutationFn: () => {
      if (orgId == null) {
        return Promise.reject(new Error("Organization is missing"));
      }
      return exportBonusHistory({ organizationId: orgId });
    },
    onSuccess: ({ blob, filename }) => {
      saveBlob(blob, stampDownloadFilename(filename));
    },
  });
}
