/**
 * Squads vault state for the connected wallet, for UI that needs m-of-n.
 *
 * Read fresh on every connection change because members and threshold are
 * mutable; the cheap SquadsX gate keeps this off the path for plain keypairs.
 */

import { useWallet as useSolanaAdapter } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { clearSquadsInfoCache, getSquadsAccountInfo } from "./info";
import type { SquadsAccountInfo } from "./types";
import { useSquadsMode } from "./use-squads-mode";

function adapterFeatures(adapter: unknown): Record<string, unknown> | undefined {
  if (!adapter || typeof adapter !== "object" || !("wallet" in adapter)) return undefined;
  const wallet = (adapter as { wallet?: { features?: Record<string, unknown> } }).wallet;
  return wallet?.features;
}

export function useSquadsAccountInfo(): SquadsAccountInfo | null {
  const { publicKey, wallet } = useSolanaAdapter();
  const { isSquads } = useSquadsMode();
  const [info, setInfo] = useState<SquadsAccountInfo | null>(null);
  const vaultAddress = publicKey?.toBase58() ?? "";

  useEffect(() => {
    if (!isSquads || !vaultAddress) {
      setInfo(null);
      if (!vaultAddress) clearSquadsInfoCache();
      return;
    }
    let cancelled = false;
    void getSquadsAccountInfo({
      vaultAddress,
      features: adapterFeatures(wallet?.adapter),
    })
      .then((next) => {
        if (!cancelled) setInfo(next);
      })
      .catch(() => {
        if (!cancelled) setInfo(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isSquads, vaultAddress, wallet]);

  return info;
}
