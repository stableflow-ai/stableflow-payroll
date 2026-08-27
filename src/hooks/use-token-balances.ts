import { useEffect, useMemo, useRef } from "react";
import type { ChainOwners } from "@/wallet";
import type { IntentsToken } from "@/stores/intents-tokens";
import { useTokenBalancesStore } from "@/stores/token-balances";

function ownersKey(owners: ChainOwners): string {
  return (["evm", "near", "solana", "tron"] as const)
    .map((kind) => {
      const address = owners[kind] || "";
      return `${kind}:${kind === "solana" ? address : address.toLowerCase()}`;
    })
    .join("|");
}

function hasAnyOwner(owners: ChainOwners): boolean {
  return Boolean(owners.evm || owners.near || owners.solana || owners.tron);
}

export function useEnsureTokenBalances(opts: {
  owners: ChainOwners;
  tokens: IntentsToken[];
  enabled?: boolean;
  pollMs?: number;
}) {
  const { owners, tokens, enabled = true, pollMs } = opts;
  const fetchAll = useTokenBalancesStore((s) => s.fetchAll);
  const clear = useTokenBalancesStore((s) => s.clear);
  const tokenKey = useMemo(
    () => tokens.map((t) => t.assetId).sort().join("|"),
    [tokens],
  );
  const ownerKey = useMemo(() => ownersKey(owners), [owners]);
  const ready = hasAnyOwner(owners);
  const wasReadyRef = useRef(false);
  const enabledRef = useRef(enabled);
  const ownersRef = useRef(owners);
  const tokensRef = useRef(tokens);
  ownersRef.current = owners;
  tokensRef.current = tokens;

  useEffect(() => {
    const justEnabled = enabled && !enabledRef.current;
    enabledRef.current = enabled;
    if (!enabled || !ready || !tokenKey) return;
    void fetchAll(ownersRef.current, tokensRef.current, { force: justEnabled });
    if (!pollMs) return;
    const id = window.setInterval(() => {
      void fetchAll(ownersRef.current, tokensRef.current, { force: true });
    }, pollMs);
    return () => window.clearInterval(id);
  }, [enabled, ready, ownerKey, tokenKey, fetchAll, pollMs]);

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
