import { create } from "zustand";
import { persist } from "zustand/middleware";

const TOKEN_SELECT_PREFS_STORAGE_KEY = "stableflow-pay:token-select-prefs:v1";

interface TokenSelectPrefsState {
  lastAssetId: string | null;
  lastBlockchain: string | null;
  setLastToken: (assetId: string, blockchain: string) => void;
  setLastBlockchain: (blockchain: string) => void;
}

export const useTokenSelectPrefsStore = create<TokenSelectPrefsState>()(
  persist(
    (set) => ({
      lastAssetId: null,
      lastBlockchain: null,
      setLastToken: (lastAssetId, lastBlockchain) => set({ lastAssetId, lastBlockchain }),
      setLastBlockchain: (lastBlockchain) => set({ lastBlockchain }),
    }),
    {
      name: TOKEN_SELECT_PREFS_STORAGE_KEY,
    },
  ),
);
