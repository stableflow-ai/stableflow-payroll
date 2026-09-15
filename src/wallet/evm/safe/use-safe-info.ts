/**
 * Safe account state for the connected wallet, for UI that needs m-of-n.
 *
 * Read fresh on every connection change because owners and threshold are mutable;
 * the cheap `isSafeAccount` gate keeps this off the path for plain EOAs.
 */

import { useEffect, useState } from "react";
import type { Address } from "viem";
import { useAccount } from "wagmi";
import { getSafeInfo } from "./info";
import type { SafeAccountInfo } from "./types";
import { useSafeMode } from "./use-safe-mode";

export function useSafeAccountInfo(): SafeAccountInfo | null {
  const { address, chainId } = useAccount();
  const { isSafe } = useSafeMode();
  const [info, setInfo] = useState<SafeAccountInfo | null>(null);

  useEffect(() => {
    if (!isSafe || !address || !chainId) {
      setInfo(null);
      return;
    }
    let cancelled = false;
    void getSafeInfo({ chainId, address: address as Address })
      .then((next) => {
        if (!cancelled) setInfo(next);
      })
      .catch(() => {
        if (!cancelled) setInfo(null);
      });
    return () => {
      cancelled = true;
    };
  }, [address, chainId, isSafe]);

  return info;
}
