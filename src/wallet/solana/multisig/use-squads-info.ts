/**
 * Squads vault state for the connected wallet, for UI that needs m-of-n.
 *
 * Read fresh on every connection change because members and threshold are
 * mutable. SquadsX uses the connected vault; the SDK path uses the bound vault.
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
  const { mode, vaultAddress } = useSquadsMode();
  const [info, setInfo] = useState<SquadsAccountInfo | null>(null);
  const member = publicKey?.toBase58() ?? "";

  useEffect(() => {
    if (!mode || !vaultAddress) {
      setInfo(null);
      if (!member) clearSquadsInfoCache();
      return;
    }
    let cancelled = false;
    void getSquadsAccountInfo({
      vaultAddress,
      features: mode === "squadsx" ? adapterFeatures(wallet?.adapter) : undefined,
      member: mode === "sdk" ? member : undefined,
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
  }, [member, mode, vaultAddress, wallet]);

  return info;
}
