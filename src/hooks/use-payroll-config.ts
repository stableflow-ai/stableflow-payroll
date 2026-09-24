import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPayrollConfig } from "@/api/payroll-config";
import { queryKeys } from "@/api/query-keys";
import { useIntentsTokensStore } from "@/stores/intents-tokens";

const CONFIG_STALE_MS = 30 * 60 * 1000;

export function usePayrollConfigQuery() {
  const applyConfig = useIntentsTokensStore((state) => state.applyConfig);
  const query = useQuery({
    queryKey: queryKeys.payroll.config,
    queryFn: getPayrollConfig,
    staleTime: CONFIG_STALE_MS,
  });

  useEffect(() => {
    if (query.data) applyConfig(query.data);
  }, [applyConfig, query.data]);

  useEffect(() => {
    if (query.isError) applyConfig(null);
  }, [applyConfig, query.isError]);

  return query;
}
