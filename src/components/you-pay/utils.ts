import { ORIGIN_TOKEN_FALLBACKS } from "./config";
import { PAYOUT_SYMBOLS, isNativeToken, type IntentsToken, type PayoutSymbol } from "@/stores/intents-tokens";

export function resolvePayOriginToken({
  savedOriginAssetId,
  findByAssetId,
  findByChainAndSymbol,
  allowedBlockchains = null,
  excludeNative = false,
}: {
  savedOriginAssetId: string | null;
  findByAssetId: (assetId: string) => IntentsToken | undefined;
  findByChainAndSymbol: (blockchain: string, symbol: PayoutSymbol) => IntentsToken | undefined;
  allowedBlockchains?: string[] | null;
  excludeNative?: boolean;
}): IntentsToken | null {
  const allowed = allowedBlockchains?.length ? new Set(allowedBlockchains) : null;

  function accept(token: IntentsToken | undefined): token is IntentsToken {
    if (!token) return false;
    if (allowed && !allowed.has(token.blockchain)) return false;
    if (excludeNative && isNativeToken(token)) return false;
    return true;
  }

  const saved = savedOriginAssetId ? findByAssetId(savedOriginAssetId) : undefined;
  if (accept(saved)) return saved;

  const defaults = ORIGIN_TOKEN_FALLBACKS
    .map((row) => findByChainAndSymbol(row.blockchain, row.symbol))
    .filter(accept);
  if (defaults[0]) return defaults[0];

  for (const chain of allowedBlockchains || []) {
    for (const symbol of PAYOUT_SYMBOLS) {
      const token = findByChainAndSymbol(chain, symbol);
      if (accept(token)) return token;
    }
  }
  return null;
}
