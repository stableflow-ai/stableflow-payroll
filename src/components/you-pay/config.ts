import type { StableSymbol } from "@/stores/intents-tokens";

export const ORIGIN_TOKEN_FALLBACKS: ReadonlyArray<{
  blockchain: string;
  symbol: StableSymbol;
}> = [
  { blockchain: "eth", symbol: "USDT" },
  { blockchain: "base", symbol: "USDC" },
  { blockchain: "arb", symbol: "USDT" },
];
