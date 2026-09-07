import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
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
import { organizationId } from "@/lib/auth-role";
import { useAuthStore } from "@/stores/auth";
import type { ExpenseHistoryQuery, ExpenseTotalPayoutPeriod } from "@/types/expense";
import { browserTimeZone } from "@/utils";
import {
  EXPENSE_HISTORY_PAGE_SIZE,
  EXPENSE_RECENT_LIMIT_MAX,
  EXPENSE_RECENT_PAGE_SIZE,
} from "@/views/expense/config";

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
  const { organizationId: orgId, enabled } = useExpenseQueryContext();
  return useQuery({
    queryKey: queryKeys.expense.openRequestsCount(orgId ?? 0),
    queryFn: () =>
      getExpenseOpenRequestsCount({
        organizationId: orgId!,
      }),
    enabled,
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
