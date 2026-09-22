/**
 * React view of `activeSquadsMode`, kept apart from `detect.ts` so the broadcast
 * layer can branch without pulling in React.
 */

import { useWallet as useSolanaAdapter } from "@solana/wallet-adapter-react";
import { useEffect, useMemo, useState } from "react";
import useToast from "@/hooks/use-toast";
import { useSquadsSdkStore } from "@/stores/squads-sdk";
import { getSquadsSdkBinding, setSquadsSdkBinding } from "../session";
import { isSquadsXAdapter } from "./detect";
import { restoreSquadsSdkBinding } from "./resolve";
import type { SquadsMode } from "./types";

export interface UseSquadsModeResult {
  mode: SquadsMode | null;
  isSquads: boolean;
  isSquadsX: boolean;
  isSdk: boolean;
  isResolving: boolean;
  vaultAddress: string | null;
}

export function useSquadsMode(): UseSquadsModeResult {
  const { wallet, connected, publicKey } = useSolanaAdapter();
  const toast = useToast();
  const member = publicKey?.toBase58() ?? "";
  const persistedRow = useSquadsSdkStore((state) => (member ? state.byMember[member] : undefined));
  const persisted = persistedRow
    ? {
        member,
        vaultAddress: persistedRow.vaultAddress,
        multisigPda: persistedRow.multisigPda,
        vaultIndex: persistedRow.vaultIndex,
      }
    : null;
  const unbind = useSquadsSdkStore((state) => state.unbind);
  const [verifiedMember, setVerifiedMember] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const isSquadsX = Boolean(connected && publicKey && isSquadsXAdapter(wallet?.adapter));

  useEffect(() => {
    if (isSquadsX || !member || !persisted) {
      setSquadsSdkBinding(null);
      setVerifiedMember(null);
      setResolving(false);
      return;
    }
    const current = getSquadsSdkBinding();
    const alreadyBound = Boolean(
      current
      && current.member === persisted.member
      && current.vaultAddress === persisted.vaultAddress
      && current.multisigPda === persisted.multisigPda
      && current.vaultIndex === persisted.vaultIndex,
    );
    let cancelled = false;
    if (alreadyBound) {
      setVerifiedMember(member);
      setResolving(false);
    } else {
      setResolving(true);
    }
    void restoreSquadsSdkBinding(persisted).then((result) => {
      if (cancelled) return;
      if (result.status === "ok") {
        setSquadsSdkBinding(result.binding);
        setVerifiedMember(member);
        setResolving(false);
        return;
      }
      setSquadsSdkBinding(null);
      setVerifiedMember(null);
      unbind(member);
      toast.fail({ title: result.error.message });
      setResolving(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isSquadsX, member, persisted?.vaultAddress, persisted?.multisigPda, persisted?.vaultIndex, unbind]);

  return useMemo(() => {
    if (isSquadsX) {
      return {
        mode: "squadsx" as const,
        isSquads: true,
        isSquadsX: true,
        isSdk: false,
        isResolving: false,
        vaultAddress: member || null,
      };
    }
    const isSdk = Boolean(persisted && verifiedMember === member && !resolving);
    return {
      mode: isSdk ? "sdk" as const : null,
      isSquads: isSdk,
      isSquadsX: false,
      isSdk,
      isResolving: resolving,
      vaultAddress: isSdk ? persisted?.vaultAddress ?? null : null,
    };
  }, [isSquadsX, member, persisted, resolving, verifiedMember]);
}
