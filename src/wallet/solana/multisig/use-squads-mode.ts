/**
 * React view of `activeSquadsMode`, kept apart from `detect.ts` so the broadcast
 * layer can branch without pulling in React.
 */

import { useWallet as useSolanaAdapter } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import { isSquadsXAdapter } from "./detect";
import type { SquadsMode } from "./types";

export interface UseSquadsModeResult {
  mode: SquadsMode | null;
  isSquads: boolean;
  isResolving: boolean;
}

export function useSquadsMode(): UseSquadsModeResult {
  const { wallet, connected, publicKey } = useSolanaAdapter();
  return useMemo(() => {
    const isSquads = Boolean(connected && publicKey && isSquadsXAdapter(wallet?.adapter));
    return {
      mode: isSquads ? "squadsx" : null,
      isSquads,
      isResolving: false,
    };
  }, [connected, publicKey, wallet]);
}
