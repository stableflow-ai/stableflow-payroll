import { create } from "zustand";
import { persist } from "zustand/middleware";

interface QuickPayPrefsState {
  originAssetId: string | null;
  setOriginAssetId: (assetId: string | null) => void;
}

export const useQuickPayPrefsStore = create<QuickPayPrefsState>()(
  persist(
    (set) => ({
      originAssetId: null,
      setOriginAssetId: (originAssetId) => set({ originAssetId }),
    }),
    {
      name: "stableflow-pay:quick-pay-prefs:v1",
    },
  ),
);
