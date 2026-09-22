import { create } from "zustand";
import { persist } from "zustand/middleware";

const TOKEN_SELECT_PREFS_STORAGE_KEY = "stableflow-pay:token-select-prefs:v1";
const TOKEN_SELECT_PREFS_VERSION = 2;
export const MAX_RECENT_BLOCKCHAINS = 16;
export const MAX_RECENT_ASSETS = 3;

interface TokenSelectPrefsState {
  recentAssetIds: string[];
  recentBlockchains: string[];
  setLastToken: (assetId: string, blockchain: string) => void;
  setLastBlockchain: (blockchain: string) => void;
}

export function rememberRecentAsset(recent: string[], assetId: string): string[] {
  const id = assetId.trim();
  if (!id) return recent;
  return [id, ...recent.filter((item) => item !== id)].slice(0, MAX_RECENT_ASSETS);
}

export function rememberRecentBlockchain(recent: string[], blockchain: string): string[] {
  const code = blockchain.trim();
  if (!code) return recent;
  return [code, ...recent.filter((item) => item !== code)].slice(0, MAX_RECENT_BLOCKCHAINS);
}

export function migrateTokenSelectPrefs(
  persisted: unknown,
  version: number,
): Pick<TokenSelectPrefsState, "recentAssetIds" | "recentBlockchains"> {
  const state = (persisted ?? {}) as {
    lastAssetId?: string | null;
    lastBlockchain?: string | null;
    recentAssetIds?: string[];
    recentBlockchains?: string[];
  };
  const recentBlockchains = version >= 1
    ? (Array.isArray(state.recentBlockchains) ? state.recentBlockchains : [])
    : (typeof state.lastBlockchain === "string" && state.lastBlockchain ? [state.lastBlockchain] : []);
  const recentAssetIds = version >= TOKEN_SELECT_PREFS_VERSION && Array.isArray(state.recentAssetIds)
    ? state.recentAssetIds.filter((id) => typeof id === "string" && id.trim()).slice(0, MAX_RECENT_ASSETS)
    : (typeof state.lastAssetId === "string" && state.lastAssetId ? [state.lastAssetId] : []);
  return { recentAssetIds, recentBlockchains };
}

export const useTokenSelectPrefsStore = create<TokenSelectPrefsState>()(
  persist(
    (set) => ({
      recentAssetIds: [],
      recentBlockchains: [],
      setLastToken: (assetId, blockchain) => set((state) => ({
        recentAssetIds: rememberRecentAsset(state.recentAssetIds, assetId),
        recentBlockchains: rememberRecentBlockchain(state.recentBlockchains, blockchain),
      })),
      setLastBlockchain: (blockchain) => set((state) => ({
        recentBlockchains: rememberRecentBlockchain(state.recentBlockchains, blockchain),
      })),
    }),
    {
      name: TOKEN_SELECT_PREFS_STORAGE_KEY,
      version: TOKEN_SELECT_PREFS_VERSION,
      migrate: migrateTokenSelectPrefs,
      partialize: (state) => ({
        recentAssetIds: state.recentAssetIds,
        recentBlockchains: state.recentBlockchains,
      }),
    },
  ),
);
