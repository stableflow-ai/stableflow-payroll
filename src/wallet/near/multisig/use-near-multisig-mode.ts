/**
 * React view of `activeNearMultisigMode`, kept apart from `detect.ts` so the
 * broadcast layer can branch without pulling in React.
 */

import { useEffect, useState } from "react";
import { useNearWalletContext } from "../provider";
import { TREZU_CONNECTOR_ID } from "./config";
import { isSputnikDao } from "./detect";
import type { NearMultisigMode } from "./types";

export interface UseNearMultisigModeResult {
  mode: NearMultisigMode | null;
  isMultisig: boolean;
  isResolving: boolean;
}

export function useNearMultisigMode(): UseNearMultisigModeResult {
  const { connector, accountId } = useNearWalletContext();
  const [mode, setMode] = useState<NearMultisigMode | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (!connector || !accountId) {
      setMode(null);
      setIsResolving(false);
      return;
    }

    let cancelled = false;
    setIsResolving(true);
    void (async () => {
      try {
        const wallet = await connector.wallet();
        if (cancelled) return;
        if (wallet.manifest.id === TREZU_CONNECTOR_ID) {
          setMode("trezu");
          return;
        }
        const isDao = await isSputnikDao(accountId);
        if (!cancelled) setMode(isDao ? "onchain" : null);
      } catch {
        if (!cancelled) setMode(null);
      } finally {
        if (!cancelled) setIsResolving(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accountId, connector]);

  return { mode, isMultisig: mode !== null, isResolving };
}
