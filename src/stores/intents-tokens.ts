/**
 * Cached 1Click supported tokens on registered chains.
 * Refresh every 30 minutes; persist to localStorage.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { FIXED_CHAINS, type ChainConfig } from "@/config/chains";
import { tokenLogoUrl } from "@/lib/logo";

const ONE_CLICK_TOKENS_URL = "https://1click.chaindefuser.com/v0/tokens";
const REFRESH_MS = 30 * 60 * 1000;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const PAYOUT_SYMBOLS = [
  "USDC",
  "USDT",
  "DAI",
  "WETH",
  "ETH",
  "BNB",
  "AVAX",
  "TRX",
  "SOL",
  "NEAR",
] as const;

export type PayoutSymbol = (typeof PAYOUT_SYMBOLS)[number];
/** @deprecated Use PayoutSymbol. */
export type StableSymbol = PayoutSymbol;

export interface IntentsToken {
  assetId: string;
  decimals: number;
  blockchain: string;
  symbol: PayoutSymbol;
  providerSymbol: string;
  price: number;
  contractAddress: string | null;
  chain: ChainConfig;
  logo: string;
}

interface ProviderToken {
  assetId: string;
  decimals: number;
  blockchain: string;
  symbol: string;
  price?: number;
  contractAddress?: string | null;
}

const PAYOUT_SYMBOL_SET = new Set<string>(PAYOUT_SYMBOLS);
export const WRAP_NEAR_CONTRACT = "wrap.near";
export const WRAP_NEAR_ASSET_ID = "nep141:wrap.near";

export function normalizeSymbol(symbol: string): PayoutSymbol | null {
  const upper = String(symbol || "").toUpperCase();
  if (upper === "USDT0") return "USDT";
  if (upper === "WNEAR") return "NEAR";
  if (PAYOUT_SYMBOL_SET.has(upper)) return upper as PayoutSymbol;
  return null;
}

export function isNativeToken(token: Pick<IntentsToken, "contractAddress"> | null | undefined): boolean {
  if (!token) return false;
  const addr = String(token.contractAddress || "").trim();
  if (!addr) return true;
  const lower = addr.toLowerCase();
  return lower === "native" || lower === ZERO_ADDRESS;
}

export function isNearWrappedGasToken(
  token: Pick<IntentsToken, "blockchain" | "assetId" | "contractAddress"> | null | undefined,
): boolean {
  if (!token || token.blockchain !== "near") return false;
  const assetId = String(token.assetId || "").trim().toLowerCase();
  if (assetId === WRAP_NEAR_ASSET_ID) return true;
  return String(token.contractAddress || "").trim().toLowerCase() === WRAP_NEAR_CONTRACT;
}

export function filterTokens(raw: ProviderToken[]): IntentsToken[] {
  const chainByCode = new Map(FIXED_CHAINS.map((c) => [c.blockchain, c]));
  const out: IntentsToken[] = [];
  for (const token of raw) {
    const chain = chainByCode.get(token.blockchain);
    if (!chain) continue;
    const symbol = normalizeSymbol(token.symbol);
    if (!symbol) continue;
    if (symbol === "NEAR" && token.blockchain !== "near") continue;
    if (!Number.isInteger(token.decimals) || token.decimals < 0) continue;
    out.push({
      assetId: token.assetId,
      decimals: token.decimals,
      blockchain: token.blockchain,
      symbol,
      providerSymbol: token.symbol,
      price: Number(token.price || 1),
      contractAddress: token.contractAddress ?? null,
      chain,
      logo: tokenLogoUrl(symbol),
    });
  }
  const hasNearWrap = out.some((token) => token.symbol === "NEAR" && isNearWrappedGasToken(token));
  if (!hasNearWrap) return out;
  return out.filter((token) => !(token.symbol === "NEAR" && token.blockchain === "near" && isNativeToken(token)));
}

interface IntentsTokensState {
  tokens: IntentsToken[];
  fetchedAt: number | null;
  loading: boolean;
  error: string | null;
  ensureFresh: () => Promise<void>;
  refresh: (force?: boolean) => Promise<void>;
  tokensForSymbol: (symbol: PayoutSymbol) => IntentsToken[];
  findByAssetId: (assetId: string) => IntentsToken | undefined;
  findByChainAndSymbol: (blockchain: string, symbol: PayoutSymbol) => IntentsToken | undefined;
}

export const useIntentsTokensStore = create<IntentsTokensState>()(
  persist(
    (set, get) => ({
      tokens: [],
      fetchedAt: null,
      loading: false,
      error: null,

      tokensForSymbol: (symbol) => get().tokens.filter((t) => t.symbol === symbol),

      findByAssetId: (assetId) => get().tokens.find((t) => t.assetId === assetId),

      findByChainAndSymbol: (blockchain, symbol) =>
        get().tokens.find((t) => t.blockchain === blockchain && t.symbol === symbol),

      ensureFresh: async () => {
        const { fetchedAt, tokens } = get();
        if (tokens.length > 0 && fetchedAt && Date.now() - fetchedAt < REFRESH_MS) return;
        await get().refresh();
      },

      refresh: async (force = false) => {
        const { fetchedAt, loading } = get();
        if (loading) return;
        if (!force && fetchedAt && Date.now() - fetchedAt < REFRESH_MS) return;
        set({ loading: true, error: null });
        try {
          const res = await fetch(ONE_CLICK_TOKENS_URL);
          if (!res.ok) throw new Error(`Tokens request failed (${res.status})`);
          const data = (await res.json()) as ProviderToken[];
          if (!Array.isArray(data)) throw new Error("Invalid tokens response");
          set({
            tokens: filterTokens(data),
            fetchedAt: Date.now(),
            loading: false,
            error: null,
          });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : "Failed to load tokens",
          });
        }
      },
    }),
    {
      name: "stableflow-pay:intents-tokens:v2.4",
      partialize: (s) => ({ tokens: s.tokens, fetchedAt: s.fetchedAt }),
    },
  ),
);
