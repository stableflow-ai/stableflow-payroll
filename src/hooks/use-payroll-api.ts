import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api/query-keys";
import {
  exportPayrollHistory,
  getPayrollCurrentStats,
  getPayrollHistory,
  getPayrollHistoryDetail,
  getPayrollNext,
  getPayrollRecentPayouts,
  getPayrollTotalPayout,
  importPayrollSalaries,
  updatePayrollSalaries,
} from "@/api/payroll";
import { MOCK_ENABLED } from "@/mocks/config";
import { getPayrollOverviewMock } from "@/mocks/payroll";
import { useAuthStore } from "@/stores/auth";
import type { PayrollTotalPayoutPeriod } from "@/types/payroll";
import { stampDownloadFilename } from "@/views/pay/utils";
import {
  PAYROLL_HISTORY_PAGE_SIZE,
  PAYROLL_MOCK_VARIANT,
  PAYROLL_RECENT_LIMIT_MAX,
  PAYROLL_RECENT_PAGE_SIZE,
  type PayrollMockVariant,
} from "@/views/payroll/config";

function clientTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function usePayrollQueryContext() {
  const token = useAuthStore((state) => state.token);
  const organizationId = useAuthStore((state) => state.user?.organization?.id ?? null);
  return {
    token,
    organizationId,
    timezone: clientTimezone(),
    enabled: Boolean(token && organizationId),
  };
}

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

/**
 * TODO(api): mock overview remains for unused fixtures until the file is deleted.
 * Stats, total payout, recent payouts, next payroll, and history use salaries endpoints.
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

export function usePayrollCurrentStatsQuery() {
  const { organizationId, timezone, enabled } = usePayrollQueryContext();
  return useQuery({
    queryKey: queryKeys.payroll.current(organizationId ?? 0, timezone),
    queryFn: () =>
      getPayrollCurrentStats({
        organizationId: organizationId!,
        timezone,
      }),
    enabled,
  });
}

export function usePayrollTotalPayoutQuery(period: PayrollTotalPayoutPeriod) {
  const { organizationId, timezone, enabled } = usePayrollQueryContext();
  return useQuery({
    queryKey: queryKeys.payroll.totalPayout(organizationId ?? 0, period, timezone),
    queryFn: () =>
      getPayrollTotalPayout({
        organizationId: organizationId!,
        period,
        timezone,
      }),
    enabled,
  });
}

export function usePayrollRecentPayoutsInfiniteQuery() {
  const { organizationId, enabled } = usePayrollQueryContext();
  return useInfiniteQuery({
    queryKey: queryKeys.payroll.recent(organizationId ?? 0),
    queryFn: async ({ pageParam }) => {
      const limit = pageParam * PAYROLL_RECENT_PAGE_SIZE;
      const rows = await getPayrollRecentPayouts({
        organizationId: organizationId!,
        limit,
      });
      return rows.slice((pageParam - 1) * PAYROLL_RECENT_PAGE_SIZE);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAYROLL_RECENT_PAGE_SIZE) return undefined;
      const loaded = allPages.reduce((count, page) => count + page.length, 0);
      if (loaded >= PAYROLL_RECENT_LIMIT_MAX) return undefined;
      return allPages.length + 1;
    },
    enabled,
  });
}

export function usePayrollNextQuery() {
  const { organizationId, timezone, enabled } = usePayrollQueryContext();
  return useQuery({
    queryKey: queryKeys.payroll.next(organizationId ?? 0, timezone),
    queryFn: () =>
      getPayrollNext({
        organizationId: organizationId!,
        timezone,
      }),
    enabled,
  });
}

export function usePayrollHistoryDetailQuery(executionId: string | null) {
  const { organizationId, timezone, enabled } = usePayrollQueryContext();
  return useQuery({
    queryKey: queryKeys.payroll.historyDetail(
      organizationId ?? 0,
      executionId ?? "",
      timezone,
    ),
    queryFn: () =>
      getPayrollHistoryDetail({
        organizationId: organizationId!,
        timezone,
        executionId: executionId!,
      }),
    enabled: enabled && Boolean(executionId),
  });
}

export function usePayrollHistoryInfiniteQuery() {
  const { organizationId, timezone, enabled } = usePayrollQueryContext();
  return useInfiniteQuery({
    queryKey: queryKeys.payroll.history(organizationId ?? 0, timezone),
    queryFn: ({ pageParam }) =>
      getPayrollHistory({
        organizationId: organizationId!,
        timezone,
        page: pageParam,
        pageSize: PAYROLL_HISTORY_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.list.length < PAYROLL_HISTORY_PAGE_SIZE) return undefined;
      if (allPages.length >= lastPage.totalPage) return undefined;
      return allPages.length + 1;
    },
    enabled,
  });
}

export function usePayrollImportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importPayrollSalaries,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.payroll.all });
    },
  });
}

export function usePayrollUpdateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePayrollSalaries,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.payroll.all });
    },
  });
}

export function usePayrollHistoryExportMutation() {
  const { organizationId, timezone } = usePayrollQueryContext();
  return useMutation({
    mutationFn: () => {
      if (organizationId == null) {
        return Promise.reject(new Error("Organization is missing"));
      }
      return exportPayrollHistory({ organizationId, timezone });
    },
    onSuccess: ({ blob, filename }) => {
      saveBlob(blob, stampDownloadFilename(filename));
    },
  });
}
