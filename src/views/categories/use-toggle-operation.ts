import { useCallback, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  useAddOrganizationOperationMutation,
} from "@/hooks/use-operation-api";
import { OPERATION_STATUS } from "@/types/operation";
import type { CategoryItem } from "./config";
import { isCategoryNavEnabled, payCategoryFromPath } from "./config";

export function useToggleOperationCategory() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const addMutation = useAddOrganizationOperationMutation();
  const pendingRef = useRef(new Set<number>());
  const [pendingIds, setPendingIds] = useState<ReadonlySet<number>>(() => new Set());

  const isPending = useCallback(
    (operationId: number) => pendingIds.has(operationId),
    [pendingIds],
  );

  async function setEnabled(item: CategoryItem, enabled: boolean) {
    if (enabled) {
      if (isCategoryNavEnabled(item)) return;
    } else if (!item.added || item.status === OPERATION_STATUS.Disabled) {
      return;
    }
    if (pendingRef.current.has(item.operationId)) return;

    pendingRef.current.add(item.operationId);
    setPendingIds(new Set(pendingRef.current));
    try {
      await addMutation.mutateAsync({
        operationId: item.operationId,
        enable: enabled,
      });
      if (!enabled && payCategoryFromPath(pathname) === item.category) {
        navigate("/", { replace: true });
      }
    } finally {
      pendingRef.current.delete(item.operationId);
      setPendingIds(new Set(pendingRef.current));
    }
  }

  return { setEnabled, isPending };
}
