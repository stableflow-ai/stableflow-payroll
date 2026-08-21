import { useEffect, useMemo, useRef } from "react";
import type { ChainOwners } from "@/wallet";
import type { IntentsToken } from "@/stores/intents-tokens";
import { useTokenBalancesStore } from "@/stores/token-balances";

function ownersKey(owners: ChainOwners): string {
  return (["evm", "near", "solana"] as const)
    .map((kind) => `${kind}:${owners[kind] || ""}`)
    .join("|");
}

function hasAnyOwner(owners: ChainOwners): boolean {
  return Boolean(owners.evm || owners.near || owners.solana);
}

export function useEnsureTokenBalances(opts: {
  owners: ChainOwners;
  tokens: IntentsToken[];
  enabled?: boolean;
}) {
  const { owners, tokens, enabled = true } = opts;
  const fetchAll = useTokenBalancesStore((s) => s.fetchAll);
  const clear = useTokenBalancesStore((s) => s.clear);
  const tokenKey = useMemo(
    () => tokens.map((t) => t.assetId).sort().join("|"),
    [tokens],
  );
  const ownerKey = useMemo(() => ownersKey(owners), [owners]);
  const ready = hasAnyOwner(owners);
  const wasReadyRef = useRef(false);

  useEffect(() => {
    if (!enabled || !ready || !tokenKey) return;
    void fetchAll(owners, tokens);
  }, [enabled, ready, ownerKey, tokenKey, fetchAll, owners, tokens]);

  useEffect(() => {
    if (wasReadyRef.current && !ready) clear();
    wasReadyRef.current = ready;
  }, [ready, clear]);
}

export function useTokenBalance(
  owner: string | null | undefined,
  assetId: string | null | undefined,
) {
  return useTokenBalancesStore((s) => s.getBalance(owner, assetId));
}
