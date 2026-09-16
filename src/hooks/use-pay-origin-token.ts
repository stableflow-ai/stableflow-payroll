import { useCallback, useEffect, useMemo, useState } from "react";
import { resolvePayOriginToken } from "@/components/you-pay/utils";
import { PAYER_BLOCKCHAINS } from "@/config/chains";
import { useIntentsTokensStore, type IntentsToken } from "@/stores/intents-tokens";
import { useQuickPayPrefsStore } from "@/stores/quick-pay-prefs";

export function usePayOriginToken(
  allowedBlockchains: string[] | null = PAYER_BLOCKCHAINS,
  opts?: { excludeNative?: boolean; excludeBlockchains?: string[] | null; remember?: boolean },
) {
  const remember = opts?.remember ?? true;
  const excludeNative = Boolean(opts?.excludeNative);
  const excludeBlockchains = opts?.excludeBlockchains ?? null;
  const savedOriginAssetId = useQuickPayPrefsStore((s) => s.originAssetId);
  const setSavedOriginAssetId = useQuickPayPrefsStore((s) => s.setOriginAssetId);
  const findByAssetId = useIntentsTokensStore((s) => s.findByAssetId);
  const findByChainAndSymbol = useIntentsTokensStore((s) => s.findByChainAndSymbol);
  const tokensReady = useIntentsTokensStore((s) => s.tokens.length > 0);
  const [prefsHydrated, setPrefsHydrated] = useState(() => useQuickPayPrefsStore.persist.hasHydrated());
  const [sessionOrigin, setSessionOrigin] = useState<IntentsToken | null>(null);

  useEffect(() => {
    if (!remember || prefsHydrated) return;
    return useQuickPayPrefsStore.persist.onFinishHydration(() => setPrefsHydrated(true));
  }, [prefsHydrated, remember]);

  const originToken = useMemo(() => {
    if (!remember) return sessionOrigin;
    if (!prefsHydrated || !tokensReady) return null;
    return resolvePayOriginToken({
      savedOriginAssetId,
      findByAssetId,
      findByChainAndSymbol,
      allowedBlockchains: allowedBlockchains ?? null,
      excludeNative,
      excludeBlockchains,
    });
  }, [
    remember,
    sessionOrigin,
    prefsHydrated,
    tokensReady,
    savedOriginAssetId,
    findByAssetId,
    findByChainAndSymbol,
    allowedBlockchains,
    excludeNative,
    excludeBlockchains,
  ]);

  const setOriginToken = useCallback((token: IntentsToken) => {
    if (!remember) {
      setSessionOrigin(token);
      return;
    }
    setSavedOriginAssetId(token.assetId);
  }, [remember, setSavedOriginAssetId]);

  return { originToken, setOriginToken, tokensReady };
}
