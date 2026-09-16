/**
 * React view of `activeSafeMode`, kept apart from `detect.ts` so the broadcast and
 * transfer layers can branch on Safe without pulling in React.
 */

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { SAFE_CONNECTOR_ID } from "./config";
import { isSafeAccount } from "./detect";
import type { SafeMode } from "./types";

export interface UseSafeModeResult {
  mode: SafeMode | null;
  isSafe: boolean;
  /** The WalletConnect path needs an on-chain probe before it can answer. */
  isResolving: boolean;
}

export function useSafeMode(): UseSafeModeResult {
  const { address, chainId, connector, isConnected } = useAccount();
  const [mode, setMode] = useState<SafeMode | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (!isConnected || !address || !chainId) {
      setMode(null);
      setIsResolving(false);
      return;
    }
    if (connector?.id === SAFE_CONNECTOR_ID) {
      setMode("app");
      setIsResolving(false);
      return;
    }

    let cancelled = false;
    setIsResolving(true);
    void isSafeAccount({ chainId, address })
      .then((isSafe) => {
        if (!cancelled) setMode(isSafe ? "walletconnect" : null);
      })
      .finally(() => {
        if (!cancelled) setIsResolving(false);
      });

    return () => {
      cancelled = true;
    };
  }, [address, chainId, connector?.id, isConnected]);

  return { mode, isSafe: mode !== null, isResolving };
}
