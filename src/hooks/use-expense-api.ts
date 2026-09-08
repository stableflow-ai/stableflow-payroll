import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  exportExpenseHistory,
  getExpenseCurrentStats,
  getExpenseHistory,
  getExpenseOpen,
  getExpenseOpenRequests,
  getExpenseOpenRequestsCount,
  getExpenseRecentPayouts,
  getExpenseTotalPayout,
  importExpenses,
} from "@/api/expense";
import { queryKeys } from "@/api/query-keys";
import { isUser, organizationId } from "@/lib/auth-role";
import { useAuthStore } from "@/stores/auth";
import type { ExpenseHistoryExportQuery, ExpenseHistoryQuery, ExpenseTotalPayoutPeriod } from "@/types/expense";
import { browserTimeZone } from "@/utils";
import { stampDownloadFilename } from "@/views/pay/utils";
import {
  EXPENSE_HISTORY_PAGE_SIZE,
  EXPENSE_OPEN_REQUESTS_COUNT_POLL_MS,
  EXPENSE_RECENT_LIMIT_MAX,
  EXPENSE_RECENT_PAGE_SIZE,
  RECENT_PAYOUTS_POLL_MS,
} from "@/views/expense/config";
import { EXECUTION_POLL_INTERVAL_MS } from "@/views/pay/execution-poll/config";
import { pollIntervalIfPending } from "@/views/pay/execution-poll/utils";

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

function useExpenseQueryContext() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const orgId = organizationId(user);
  return {
    organizationId: orgId,
    timezone: browserTimeZone(),
    enabled: Boolean(token) && orgId !== null,
  };
}

export function useExpenseCurrentStatsQuery() {
  const { organizationId: orgId, timezone, enabled } = useExpenseQueryContext();
  return useQuery({
    queryKey: queryKeys.expense.current(orgId ?? 0, timezone),
    queryFn: () =>
      getExpenseCurrentStats({
        organizationId: orgId!,
        timezone,
      }),
    enabled,
  });
}

export function useExpenseTotalPayoutQuery(period: ExpenseTotalPayoutPeriod) {
  const { organizationId: orgId, timezone, enabled } = useExpenseQueryContext();
  return useQuery({
    queryKey: queryKeys.expense.totalPayout(orgId ?? 0, period, timezone),
    queryFn: () =>
      getExpenseTotalPayout({
        organizationId: orgId!,
        period,
        timezone,
      }),
    enabled,
  });
}

export function useExpenseRecentPayoutsInfiniteQuery() {
  const { organizationId: orgId, enabled } = useExpenseQueryContext();
  return useInfiniteQuery({
    queryKey: queryKeys.expense.recent(orgId ?? 0),
    queryFn: async ({ pageParam }) => {
      const limit = pageParam * EXPENSE_RECENT_PAGE_SIZE;
      const rows = await getExpenseRecentPayouts({
        organizationId: orgId!,
        limit,
      });
      return rows.slice((pageParam - 1) * EXPENSE_RECENT_PAGE_SIZE);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < EXPENSE_RECENT_PAGE_SIZE) return undefined;
      const loaded = allPages.reduce((count, page) => count + page.length, 0);
      if (loaded >= EXPENSE_RECENT_LIMIT_MAX) return undefined;
      return allPages.length + 1;
    },
    enabled,
    refetchInterval: (query) =>
      pollIntervalIfPending(query.state.data?.pages.flat(), RECENT_PAYOUTS_POLL_MS),
    refetchIntervalInBackground: false,
  });
}

export function useExpenseOpenQuery() {
  const { organizationId: orgId, enabled } = useExpenseQueryContext();
  return useQuery({
    queryKey: queryKeys.expense.open(orgId ?? 0),
    queryFn: () =>
      getExpenseOpen({
        organizationId: orgId!,
      }),
    enabled,
  });
}

export function useExpenseOpenRequestsQuery() {
  const { organizationId: orgId, enabled } = useExpenseQueryContext();
  return useQuery({
    queryKey: queryKeys.expense.openRequests(orgId ?? 0),
    queryFn: () =>
      getExpenseOpenRequests({
        organizationId: orgId!,
      }),
    enabled,
  });
}

export function useExpenseOpenRequestsCountQuery() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const orgId = organizationId(user);
  const enabled = Boolean(token) && orgId !== null && !isUser(user);
  return useQuery({
    queryKey: queryKeys.expense.openRequestsCount(orgId ?? 0),
    queryFn: () =>
      getExpenseOpenRequestsCount({
        organizationId: orgId!,
      }),
    enabled,
    refetchInterval: EXPENSE_OPEN_REQUESTS_COUNT_POLL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: "always",
  });
}

export function useExpenseHistoryInfiniteQuery(
  params: Pick<ExpenseHistoryQuery, "search" | "startTime" | "endTime">,
  enabled = true,
) {
  const { organizationId: orgId, enabled: scopedEnabled } = useExpenseQueryContext();
  const search = params.search?.trim() || undefined;
  return useInfiniteQuery({
    queryKey: queryKeys.expense.history(orgId ?? 0, {
      search,
      startTime: params.startTime,
      endTime: params.endTime,
    }),
    queryFn: ({ pageParam }) =>
      getExpenseHistory({
        organizationId: orgId!,
        page: pageParam,
        pageSize: EXPENSE_HISTORY_PAGE_SIZE,
        search,
        startTime: params.startTime,
        endTime: params.endTime,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.list.length < EXPENSE_HISTORY_PAGE_SIZE) return undefined;
      if (allPages.length >= lastPage.totalPage) return undefined;
      return allPages.length + 1;
    },
    enabled: scopedEnabled && enabled,
    placeholderData: keepPreviousData,
    refetchInterval: (query) =>
      pollIntervalIfPending(
        query.state.data?.pages.flatMap((page) => page.list),
        EXECUTION_POLL_INTERVAL_MS,
      ),
    refetchIntervalInBackground: false,
  });
}

export function useExpenseImportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importExpenses,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.expense.all });
    },
  });
}

export function useExpenseHistoryExportMutation() {
  const { organizationId: orgId } = useExpenseQueryContext();
  return useMutation({
    mutationFn: (params: Pick<ExpenseHistoryExportQuery, "search" | "startTime" | "endTime">) => {
      if (orgId == null) {
        return Promise.reject(new Error("Organization is missing"));
      }
      return exportExpenseHistory({
        organizationId: orgId,
        search: params.search,
        startTime: params.startTime,
        endTime: params.endTime,
      });
    },
    onSuccess: ({ blob, filename }) => {
      saveBlob(blob, stampDownloadFilename(filename));
    },
  });
}
