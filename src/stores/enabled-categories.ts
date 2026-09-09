import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_ENABLED_CATEGORY_IDS,
  type CategoryId,
} from "@/views/categories/config";

const STORAGE_KEY = "stableflow-pay:enabled-categories:v1";

interface EnabledCategoriesState {
  enabledIds: CategoryId[];
  setEnabled: (id: CategoryId, enabled: boolean) => void;
}

export const useEnabledCategoriesStore = create<EnabledCategoriesState>()(
  persist(
    (set) => ({
      enabledIds: [...DEFAULT_ENABLED_CATEGORY_IDS],
      setEnabled: (id, enabled) =>
        set((state) => {
          const has = state.enabledIds.includes(id);
          if (enabled) {
            if (has) return state;
            return { enabledIds: [...state.enabledIds, id] };
          }
          if (!has) return state;
          return { enabledIds: state.enabledIds.filter((item) => item !== id) };
        }),
    }),
    { name: STORAGE_KEY },
  ),
);
