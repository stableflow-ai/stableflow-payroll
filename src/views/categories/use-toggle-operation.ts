import { useLocation, useNavigate } from "react-router-dom";
import {
  useAddOrganizationOperationMutation,
  useUpdateOrganizationOperationStatusMutation,
} from "@/hooks/use-operation-api";
import { OPERATION_STATUS } from "@/types/operation";
import type { CategoryItem } from "./config";
import { isCategoryNavEnabled, payCategoryFromPath } from "./config";

export function useToggleOperationCategory() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const addMutation = useAddOrganizationOperationMutation();
  const statusMutation = useUpdateOrganizationOperationStatusMutation();
  const busy = addMutation.isPending || statusMutation.isPending;

  async function setEnabled(item: CategoryItem, enabled: boolean) {
    if (enabled) {
      if (isCategoryNavEnabled(item)) return;
      if (!item.added) {
        await addMutation.mutateAsync(item.operationId);
        return;
      }
      await statusMutation.mutateAsync({
        operationId: item.operationId,
        status: OPERATION_STATUS.Active,
      });
      return;
    }
    if (!item.added || item.status === OPERATION_STATUS.Disabled) return;
    await statusMutation.mutateAsync({
      operationId: item.operationId,
      status: OPERATION_STATUS.Disabled,
    });
    if (payCategoryFromPath(pathname) === item.category) {
      navigate("/", { replace: true });
    }
  }

  return { setEnabled, busy };
}
