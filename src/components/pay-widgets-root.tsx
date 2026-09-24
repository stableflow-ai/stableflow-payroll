import { useCallback, useMemo, type ReactNode } from "react";
import {
  parsePopularTokens,
  PayWidgetsProvider,
  type PayConfigSource,
  type ReadBalances,
} from "@stableflow/pay-widgets/token-select";
import useToast from "@/hooks/use-toast";
import { intentsTokenForSelection, useIntentsTokensStore } from "@/stores/intents-tokens";
import { useTokenBalancesStore } from "@/stores/token-balances";
import { useWalletStore } from "@/stores/wallet";
import { CHAIN_KINDS, type ChainKind } from "@/wallet";
import { useSafeMode } from "@/wallet/evm/safe";

export function PayWidgetsRoot({ children }: { children: ReactNode }) {
  const chains = useWalletStore((state) => state.chains);
  const connect = useWalletStore((state) => state.connect);
  const disconnect = useWalletStore((state) => state.disconnect);
  const safeApp = useSafeMode().mode === "app";
  const toast = useToast();
  const popularTokens = useMemo(
    () => parsePopularTokens(import.meta.env.VITE_POPULAR_TOKENS),
    [],
  );

  const accounts = useMemo(() => {
    const next = {} as Record<ChainKind, {
      address: string | null;
      icon: string | null;
      connecting: boolean;
      canDisconnect: boolean;
    }>;
    for (const kind of CHAIN_KINDS) {
      const slice = chains[kind];
      next[kind] = {
        address: slice.account?.address ?? null,
        icon: slice.account?.icon ?? null,
        connecting: slice.connecting,
        canDisconnect: kind === "evm" ? !safeApp : true,
      };
    }
    return next;
  }, [chains, safeApp]);

  const readBalances = useCallback<ReadBalances>(async (batch) => {
    const resolved = batch.tokens.map((token) => ({
      assetId: token.assetId,
      intents: intentsTokenForSelection(token),
    }));
    const readable = resolved.flatMap((item) => (item.intents ? [item.intents] : []));
    if (readable.length > 0) {
      await useTokenBalancesStore.getState().fetchAll(
        { [batch.chainKind]: batch.owner },
        readable,
        { force: true },
      );
    }
    return resolved.map((item) => {
      if (!item.intents) return { assetId: item.assetId, error: "Unknown token" };
      const entry = useTokenBalancesStore.getState().getBalance(batch.owner, item.assetId);
      if (!entry || entry.status === "error" || entry.formatted == null) {
        return { assetId: item.assetId, error: entry?.error || "Failed to read balance" };
      }
      return {
        assetId: item.assetId,
        formatted: entry.formatted,
        raw: entry.raw == null ? undefined : entry.raw.toString(),
      };
    });
  }, []);

  const onConfig = useCallback((config: PayConfigSource) => {
    useIntentsTokensStore.getState().applyConfig(config);
  }, []);

  const onCopyAddress = useCallback(async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success({ title: "Copied" });
    } catch {
      toast.fail({ title: "Could not copy" });
    }
  }, [toast]);

  const apiHost = import.meta.env.VITE_API_BASE_URL?.trim() || undefined;

  return (
    <PayWidgetsProvider
      apiHost={apiHost}
      popularTokens={popularTokens}
      wallet={{ accounts, connect, disconnect }}
      readBalances={readBalances}
      onConfig={onConfig}
      onCopyAddress={onCopyAddress}
    >
      {children}
    </PayWidgetsProvider>
  );
}
