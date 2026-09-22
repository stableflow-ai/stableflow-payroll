/**
 * DAO account state for the connected wallet, for UI that needs m-of-n.
 *
 * Read fresh on every connection change because members and threshold are
 * mutable; the cheap `isMultisig` gate keeps this off the path for plain accounts.
 */

import { useEffect, useState } from "react";
import { useNearWalletContext } from "../provider";
import { getNearDaoInfo } from "./info";
import type { NearDaoInfo } from "./types";
import { useNearMultisigMode } from "./use-near-multisig-mode";

export function useNearDaoInfo(): NearDaoInfo | null {
  const { accountId } = useNearWalletContext();
  const { isMultisig } = useNearMultisigMode();
  const [info, setInfo] = useState<NearDaoInfo | null>(null);

  useEffect(() => {
    if (!isMultisig || !accountId) {
      setInfo(null);
      return;
    }
    let cancelled = false;
    void getNearDaoInfo(accountId)
      .then((next) => {
        if (!cancelled) setInfo(next);
      })
      .catch(() => {
        if (!cancelled) setInfo(null);
      });
    return () => {
      cancelled = true;
    };
  }, [accountId, isMultisig]);

  return info;
}
