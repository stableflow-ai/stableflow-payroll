/**
 * TODO(api): mock data until the history contract exists.
 * Replace with:
 *   1. types in src/types/<domain>.ts
 *   2. a function in src/api/<domain>.ts
 *   3. a key in src/api/query-keys.ts
 *   4. queryFn -> the real api function
 *   5. delete src/mocks/history.ts and its MOCK_ENABLED entry
 */
import { useMutation, useQuery } from "@tanstack/react-query";
import { MOCK_ENABLED } from "@/mocks/config";
import {
  exportHistory,
  listHistory,
  type HistoryExportQuery,
  type HistoryQuery,
} from "@/mocks/history";
import { useAuthStore } from "@/stores/auth";
import { stampDownloadFilename } from "@/views/pay/utils";

export type { HistoryExportQuery, HistoryItem, HistoryQuery } from "@/mocks/history";

const HISTORY_KEY = ["history"] as const;

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

export function useHistoryQuery(params: HistoryQuery) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: [...HISTORY_KEY, params] as const,
    queryFn: () => listHistory(params),
    enabled: Boolean(token) && MOCK_ENABLED.history,
  });
}

export function useExportHistoryMutation() {
  return useMutation({
    mutationFn: (params: HistoryExportQuery) => exportHistory(params),
    onSuccess: ({ blob, filename }) => {
      saveBlob(blob, stampDownloadFilename(filename));
    },
  });
}
