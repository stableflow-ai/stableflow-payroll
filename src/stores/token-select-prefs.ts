import { create } from "zustand";
import { persist } from "zustand/middleware";

const TOKEN_SELECT_PREFS_STORAGE_KEY = "stableflow-pay:token-select-prefs:v1";
const TOKEN_SELECT_PREFS_VERSION = 1;
export const MAX_RECENT_BLOCKCHAINS = 16;

interface TokenSelectPrefsState {
  lastAssetId: string | null;
  recentBlockchains: string[];
  setLastToken: (assetId: string, blockchain: string) => void;
  setLastBlockchain: (blockchain: string) => void;
}

export function rememberRecentBlockchain(recent: string[], blockchain: string): string[] {
  const code = blockchain.trim();
  if (!code) return recent;
  return [code, ...recent.filter((item) => item !== code)].slice(0, MAX_RECENT_BLOCKCHAINS);
}

export function migrateTokenSelectPrefs(
  persisted: unknown,
  version: number,
): Pick<TokenSelectPrefsState, "lastAssetId" | "recentBlockchains"> {
  const state = (persisted ?? {}) as {
    lastAssetId?: string | null;
    lastBlockchain?: string | null;
    recentBlockchains?: string[];
  };
  const lastAssetId = state.lastAssetId ?? null;
  if (version >= TOKEN_SELECT_PREFS_VERSION) {
    return {
      lastAssetId,
      recentBlockchains: Array.isArray(state.recentBlockchains) ? state.recentBlockchains : [],
    };
  }
  const last = typeof state.lastBlockchain === "string" && state.lastBlockchain
    ? state.lastBlockchain
    : null;
  return {
    lastAssetId,
    recentBlockchains: last ? [last] : [],
  };
}

export const useTokenSelectPrefsStore = create<TokenSelectPrefsState>()(
  persist(
    (set) => ({
      lastAssetId: null,
      recentBlockchains: [],
      setLastToken: (lastAssetId, blockchain) => set((state) => ({
        lastAssetId,
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
        lastAssetId: state.lastAssetId,
        recentBlockchains: state.recentBlockchains,
      }),
    },
  ),
);
