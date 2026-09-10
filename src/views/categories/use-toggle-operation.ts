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
  const busy = addMutation.isPending;

  async function setEnabled(item: CategoryItem, enabled: boolean) {
    if (enabled) {
      if (isCategoryNavEnabled(item)) return;
      await addMutation.mutateAsync({
        operationId: item.operationId,
        enable: true,
      });
      return;
    }
    if (!item.added || item.status === OPERATION_STATUS.Disabled) return;
    await addMutation.mutateAsync({
      operationId: item.operationId,
      enable: false,
    });
    if (payCategoryFromPath(pathname) === item.category) {
      navigate("/", { replace: true });
    }
  }

  return { setEnabled, busy };
}
