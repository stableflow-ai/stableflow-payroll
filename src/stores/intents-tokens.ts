/**
 * Cached payroll config tokens and chains.
 * Refresh via GET /v1/pay/config; persist the last successful payload.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  FIXED_CHAINS,
  mergeApiChains,
  setRuntimeChains,
  type ChainConfig,
} from "@/config/chains";
import { tokenLogoUrl } from "@/lib/logo";
import type { PayrollConfig, PayrollConfigToken } from "@/types/payroll-config";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const FALLBACK_PAYOUT_SYMBOLS = [
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
  "ZEC",
  "RHEA",
] as const;

/** @deprecated Use getPayoutSymbols(). Kept as a fail-open list. */
export const PAYOUT_SYMBOLS: string[] = [...FALLBACK_PAYOUT_SYMBOLS];

export type PayoutSymbol = string;
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
  supportPayment: boolean;
  supportReceive: boolean;
}

export const WRAP_NEAR_CONTRACT = "wrap.near";

export function tokenAssetId(
  network: string,
  symbol: string,
  contractAddress: string | null | undefined,
): string {
  const addr = String(contractAddress || "").trim();
  return `${network}:${symbol}:${addr || "native"}`;
}

export function normalizeSymbol(symbol: string): PayoutSymbol | null {
  const upper = String(symbol || "").trim().toUpperCase();
  if (!upper) return null;
  if (upper === "USDT0") return "USDT";
  if (upper === "WNEAR") return "NEAR";
  return upper;
}

export function isNativeToken(token: Pick<IntentsToken, "contractAddress"> | null | undefined): boolean {
  if (!token) return false;
  const addr = String(token.contractAddress || "").trim();
  if (!addr) return true;
  const lower = addr.toLowerCase();
  return lower === "native" || lower === ZERO_ADDRESS;
}

export function isNearWrappedGasToken(
  token: Pick<IntentsToken, "blockchain" | "contractAddress"> | null | undefined,
): boolean {
  if (!token || token.blockchain !== "near") return false;
  return String(token.contractAddress || "").trim().toLowerCase() === WRAP_NEAR_CONTRACT;
}

export function mapConfigTokens(raw: PayrollConfigToken[], chains: ChainConfig[]): IntentsToken[] {
  const chainByCode = new Map(chains.map((chain) => [chain.blockchain, chain]));
  const out: IntentsToken[] = [];
  for (const token of raw) {
    const chain = chainByCode.get(token.network);
    if (!chain) continue;
    const symbol = normalizeSymbol(token.symbol);
    if (!symbol) continue;
    if (!Number.isInteger(token.decimals) || token.decimals < 0) continue;
    const contractAddress = token.contractAddress.trim() || null;
    out.push({
      assetId: tokenAssetId(token.network, symbol, contractAddress),
      decimals: token.decimals,
      blockchain: token.network,
      symbol,
      providerSymbol: token.symbol,
      price: Number(token.price || 1),
      contractAddress,
      chain,
      logo: tokenLogoUrl(symbol),
      supportPayment: token.supportPayment,
      supportReceive: token.supportReceive,
    });
  }
  const hasNearWrap = out.some((token) => token.symbol === "NEAR" && isNearWrappedGasToken(token));
  if (!hasNearWrap) return out;
  return out.filter((token) => !(token.symbol === "NEAR" && token.blockchain === "near" && isNativeToken(token)));
}

export function uniquePayoutSymbols(tokens: IntentsToken[]): string[] {
  const seen = new Set<string>();
  const symbols: string[] = [];
  for (const token of tokens) {
    if (seen.has(token.symbol)) continue;
    seen.add(token.symbol);
    symbols.push(token.symbol);
  }
  return symbols;
}

export function getPayoutSymbols(): string[] {
  const symbols = useIntentsTokensStore.getState().symbols;
  return symbols.length > 0 ? symbols : [...FALLBACK_PAYOUT_SYMBOLS];
}

interface IntentsTokensState {
  tokens: IntentsToken[];
  chains: ChainConfig[];
  symbols: string[];
  fetchedAt: number | null;
  loading: boolean;
  error: string | null;
  applyConfig: (config: PayrollConfig | null) => void;
  tokensForSymbol: (symbol: PayoutSymbol) => IntentsToken[];
  findByAssetId: (assetId: string) => IntentsToken | undefined;
  findByChainAndSymbol: (blockchain: string, symbol: PayoutSymbol) => IntentsToken | undefined;
}

export const useIntentsTokensStore = create<IntentsTokensState>()(
  persist(
    (set, get) => ({
      tokens: [],
      chains: [],
      symbols: [],
      fetchedAt: null,
      loading: false,
      error: null,

      tokensForSymbol: (symbol) => get().tokens.filter((token) => token.symbol === symbol),

      findByAssetId: (assetId) => get().tokens.find((token) => token.assetId === assetId),

      findByChainAndSymbol: (blockchain, symbol) =>
        get().tokens.find((token) => token.blockchain === blockchain && token.symbol === symbol),

      applyConfig: (config) => {
        if (config) {
          const merged = mergeApiChains(config.chains);
          const chains = merged.length > 0 ? merged : FIXED_CHAINS;
          const tokens = mapConfigTokens(config.tokens, chains);
          const symbols = uniquePayoutSymbols(tokens);
          setRuntimeChains(chains);
          PAYOUT_SYMBOLS.splice(0, PAYOUT_SYMBOLS.length, ...symbols);
          set({
            tokens,
            chains,
            symbols,
            fetchedAt: Date.now(),
            loading: false,
            error: null,
          });
          return;
        }
        const cached = get();
        if (cached.tokens.length > 0 && cached.chains.length > 0) {
          setRuntimeChains(cached.chains);
          PAYOUT_SYMBOLS.splice(0, PAYOUT_SYMBOLS.length, ...cached.symbols);
          set({ loading: false, error: cached.error });
          return;
        }
        setRuntimeChains(FIXED_CHAINS);
        PAYOUT_SYMBOLS.splice(0, PAYOUT_SYMBOLS.length, ...FALLBACK_PAYOUT_SYMBOLS);
        set({
          loading: false,
          error: "Failed to load config",
        });
      },
    }),
    {
      name: "stableflow-pay:intents-tokens:v2-config",
      partialize: (state) => ({
        tokens: state.tokens,
        chains: state.chains,
        symbols: state.symbols,
        fetchedAt: state.fetchedAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.chains?.length) {
          setRuntimeChains(state.chains);
          PAYOUT_SYMBOLS.splice(0, PAYOUT_SYMBOLS.length, ...(state.symbols.length ? state.symbols : FALLBACK_PAYOUT_SYMBOLS));
        }
      },
    },
  ),
);
