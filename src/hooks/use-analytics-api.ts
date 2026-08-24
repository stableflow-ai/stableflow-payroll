import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/api/query-keys";
import { getPayAnalytics } from "@/api/analytics";
import { useAuthStore } from "@/stores/auth";

export function useAnalyticsQuery(month: string) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: queryKeys.analytics.month(month),
    queryFn: () => getPayAnalytics(month),
    enabled: Boolean(token) && Boolean(month),
  });
}
