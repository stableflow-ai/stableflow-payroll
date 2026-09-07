import { useMutation, useQuery } from "@tanstack/react-query";
import { exportHistory, getHistory } from "@/api/history";
import { queryKeys } from "@/api/query-keys";
import { isUser } from "@/lib/auth-role";
import { useAuthStore } from "@/stores/auth";
import type { HistoryExportQuery, HistoryQuery } from "@/types/history";
import { stampDownloadFilename } from "@/views/pay/utils";

export type { HistoryExportQuery, HistoryItem, HistoryQuery } from "@/types/history";

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

export function useHistoryQuery(params: HistoryQuery | null) {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const member = isUser(user);
  return useQuery({
    queryKey: queryKeys.history.list({ member, ...params }),
    queryFn: () => getHistory(params!, member),
    enabled: Boolean(token) && params != null,
  });
}

export function useExportHistoryMutation() {
  const user = useAuthStore((state) => state.user);
  const member = isUser(user);
  return useMutation({
    mutationFn: (params: HistoryExportQuery) => exportHistory(params, member),
    onSuccess: ({ blob, filename }) => {
      saveBlob(blob, stampDownloadFilename(filename));
    },
  });
}
