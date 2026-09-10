import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addOrganizationOperation,
  exportOperationHistory,
  getOperationCatalog,
  getOperationCurrentStats,
  getOperationHistory,
  getOperationOpen,
  getOperationRecentPayouts,
  getOperationTotalPayout,
  importOperations,
  updateOrganizationOperationStatus,
} from "@/api/operation";
import { queryKeys } from "@/api/query-keys";
import { isUser, organizationId } from "@/lib/auth-role";
import { useAuthStore } from "@/stores/auth";
import {
  OPERATION_STATUS,
  type OperationHistoryExportQuery,
  type OperationHistoryQuery,
  type OperationTotalPayoutPeriod,
} from "@/types/operation";
import { browserTimeZone } from "@/utils";
import { stampDownloadFilename } from "@/views/pay/utils";
import {
  OPERATION_HISTORY_PAGE_SIZE,
  OPERATION_RECENT_LIMIT_MAX,
  OPERATION_RECENT_PAGE_SIZE,
  RECENT_PAYOUTS_POLL_MS,
} from "@/views/categories/live-config";
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

function useOperationQueryContext() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const orgId = organizationId(user);
  return {
    organizationId: orgId,
    timezone: browserTimeZone(),
    enabled: Boolean(token) && orgId !== null,
    isAdmin: Boolean(token) && orgId !== null && !isUser(user),
  };
}

export function useOperationCatalogQuery() {
  const { organizationId: orgId, isAdmin } = useOperationQueryContext();
  return useQuery({
    queryKey: queryKeys.operation.catalog(orgId ?? 0),
    queryFn: () => getOperationCatalog(orgId!),
    enabled: isAdmin,
  });
}

export function useOperationCurrentStatsQuery(category: string) {
  const { organizationId: orgId, timezone, enabled } = useOperationQueryContext();
  const trimmed = category.trim();
  return useQuery({
    queryKey: queryKeys.operation.current(orgId ?? 0, trimmed, timezone),
    queryFn: () =>
      getOperationCurrentStats({
        category: trimmed,
        organizationId: orgId!,
        timezone,
      }),
    enabled: enabled && Boolean(trimmed),
  });
}

export function useOperationTotalPayoutQuery(
  category: string,
  period: OperationTotalPayoutPeriod,
) {
  const { organizationId: orgId, timezone, enabled } = useOperationQueryContext();
  const trimmed = category.trim();
  return useQuery({
    queryKey: queryKeys.operation.totalPayout(orgId ?? 0, trimmed, period, timezone),
    queryFn: () =>
      getOperationTotalPayout({
        category: trimmed,
        organizationId: orgId!,
        period,
        timezone,
      }),
    enabled: enabled && Boolean(trimmed),
  });
}

export function useOperationRecentPayoutsInfiniteQuery(category: string) {
  const { organizationId: orgId, enabled } = useOperationQueryContext();
  const trimmed = category.trim();
  return useInfiniteQuery({
    queryKey: queryKeys.operation.recent(orgId ?? 0, trimmed),
    queryFn: async ({ pageParam }) => {
      const limit = pageParam * OPERATION_RECENT_PAGE_SIZE;
      const rows = await getOperationRecentPayouts({
        category: trimmed,
        organizationId: orgId!,
        limit,
      });
      return rows.slice((pageParam - 1) * OPERATION_RECENT_PAGE_SIZE);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < OPERATION_RECENT_PAGE_SIZE) return undefined;
      const loaded = allPages.reduce((count, page) => count + page.length, 0);
      if (loaded >= OPERATION_RECENT_LIMIT_MAX) return undefined;
      return allPages.length + 1;
    },
    enabled: enabled && Boolean(trimmed),
    refetchInterval: (query) =>
      pollIntervalIfPending(query.state.data?.pages.flat(), RECENT_PAYOUTS_POLL_MS),
    refetchIntervalInBackground: false,
  });
}

export function useOperationOpenQuery(category: string) {
  const { organizationId: orgId, enabled } = useOperationQueryContext();
  const trimmed = category.trim();
  return useQuery({
    queryKey: queryKeys.operation.open(orgId ?? 0, trimmed),
    queryFn: () =>
      getOperationOpen({
        category: trimmed,
        organizationId: orgId!,
      }),
    enabled: enabled && Boolean(trimmed),
  });
}

export function useOperationHistoryInfiniteQuery(
  category: string,
  params: Pick<OperationHistoryQuery, "startTime" | "endTime">,
  enabled = true,
) {
  const { organizationId: orgId, enabled: scopedEnabled } = useOperationQueryContext();
  const trimmed = category.trim();
  return useInfiniteQuery({
    queryKey: queryKeys.operation.history(orgId ?? 0, trimmed, {
      startTime: params.startTime,
      endTime: params.endTime,
    }),
    queryFn: ({ pageParam }) =>
      getOperationHistory({
        category: trimmed,
        organizationId: orgId!,
        page: pageParam,
        pageSize: OPERATION_HISTORY_PAGE_SIZE,
        startTime: params.startTime,
        endTime: params.endTime,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.list.length < OPERATION_HISTORY_PAGE_SIZE) return undefined;
      if (allPages.length >= lastPage.totalPage) return undefined;
      return allPages.length + 1;
    },
    enabled: scopedEnabled && enabled && Boolean(trimmed),
    placeholderData: keepPreviousData,
    refetchInterval: (query) =>
      pollIntervalIfPending(
        query.state.data?.pages.flatMap((page) => page.list),
        EXECUTION_POLL_INTERVAL_MS,
      ),
    refetchIntervalInBackground: false,
  });
}

function invalidateOperations(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.operation.all });
}

export function useAddOrganizationOperationMutation() {
  const queryClient = useQueryClient();
  const { organizationId: orgId } = useOperationQueryContext();
  return useMutation({
    mutationFn: (operationId: number) => {
      if (orgId == null) {
        return Promise.reject(new Error("Organization is missing"));
      }
      return addOrganizationOperation(orgId, operationId);
    },
    onSuccess: () => invalidateOperations(queryClient),
  });
}

export function useUpdateOrganizationOperationStatusMutation() {
  const queryClient = useQueryClient();
  const { organizationId: orgId } = useOperationQueryContext();
  return useMutation({
    mutationFn: (params: {
      operationId: number;
      status: typeof OPERATION_STATUS.Active | typeof OPERATION_STATUS.Disabled;
    }) => {
      if (orgId == null) {
        return Promise.reject(new Error("Organization is missing"));
      }
      return updateOrganizationOperationStatus(orgId, params.operationId, params.status);
    },
    onSuccess: () => invalidateOperations(queryClient),
  });
}

export function useOperationImportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importOperations,
    onSuccess: () => invalidateOperations(queryClient),
  });
}

export function useOperationHistoryExportMutation(category: string) {
  const { organizationId: orgId } = useOperationQueryContext();
  const trimmed = category.trim();
  return useMutation({
    mutationFn: (params: Pick<OperationHistoryExportQuery, "startTime" | "endTime">) => {
      if (orgId == null) {
        return Promise.reject(new Error("Organization is missing"));
      }
      return exportOperationHistory({
        category: trimmed,
        organizationId: orgId,
        startTime: params.startTime,
        endTime: params.endTime,
      });
    },
    onSuccess: ({ blob, filename }) => {
      saveBlob(blob, stampDownloadFilename(filename));
    },
  });
}
