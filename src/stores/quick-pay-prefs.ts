import { create } from "zustand";
import { persist } from "zustand/middleware";

interface QuickPayPrefsState {
  originAssetId: string | null;
  notifyRecipient: boolean;
  setOriginAssetId: (assetId: string | null) => void;
  setNotifyRecipient: (enabled: boolean) => void;
}

export const useQuickPayPrefsStore = create<QuickPayPrefsState>()(
  persist(
    (set) => ({
      originAssetId: null,
      notifyRecipient: false,
      setOriginAssetId: (originAssetId) => set({ originAssetId }),
      setNotifyRecipient: (notifyRecipient) => set({ notifyRecipient }),
    }),
    {
      name: "stableflow-pay:quick-pay-prefs:v1",
    },
  ),
);
