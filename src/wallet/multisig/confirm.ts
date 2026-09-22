import { safeQueueUrl, squadsQueueUrl, trezuRequestsUrl } from "@/config/chains";
import type { ChainKind } from "@/wallet/types";
import { getConnections } from "wagmi/actions";
import { wagmiConfig } from "../evm/config";
import {
  SAFE_PROPOSAL_CONFIRM_MESSAGE,
  SAFE_PROPOSAL_QUEUE_LINK_LABEL,
} from "../evm/safe/config";
import { activeSafeMode } from "../evm/safe/detect";
import {
  TREZU_PROPOSAL_CONFIRM_MESSAGE,
  TREZU_PROPOSAL_QUEUE_LINK_LABEL,
} from "../near/multisig/config";
import { activeNearMultisigMode } from "../near/multisig/detect";
import { getNearConnector } from "../near/session";
import {
  SQUADS_PROPOSAL_CONFIRM_MESSAGE,
  SQUADS_PROPOSAL_QUEUE_LINK_LABEL,
} from "../solana/multisig/config";
import { activeSquadsMode } from "../solana/multisig/detect";
import { getSolanaSigner, getSquadsSdkBinding } from "../solana/session";
import type { MultisigConfirmCopy } from "./types";

/**
 * Queue-link copy for Toast 1, shown before the wallet SDK returns. The
 * specific proposal id is not known yet, so links go to the queue list.
 */
export async function resolveMultisigConfirmToast(
  chainKind: ChainKind,
): Promise<MultisigConfirmCopy | null> {
  if (chainKind === "evm") {
    if (!(await activeSafeMode())) return null;
    const [connection] = getConnections(wagmiConfig);
    const address = connection?.accounts[0];
    const chainId = connection?.chainId;
    if (!address || chainId == null) return null;
    return {
      url: safeQueueUrl(chainId, address),
      title: SAFE_PROPOSAL_CONFIRM_MESSAGE,
      label: SAFE_PROPOSAL_QUEUE_LINK_LABEL,
    };
  }
  if (chainKind === "near") {
    if (!(await activeNearMultisigMode())) return null;
    const connector = getNearConnector();
    if (!connector) return null;
    let daoId = "";
    try {
      const wallet = await connector.wallet();
      daoId = (await wallet.getAccounts())[0]?.accountId?.trim() ?? "";
    } catch {
      return null;
    }
    if (!daoId) return null;
    return {
      url: trezuRequestsUrl(daoId),
      title: TREZU_PROPOSAL_CONFIRM_MESSAGE,
      label: TREZU_PROPOSAL_QUEUE_LINK_LABEL,
    };
  }
  if (chainKind === "solana") {
    const mode = activeSquadsMode();
    if (!mode) return null;
    const vault = mode === "sdk"
      ? (getSquadsSdkBinding()?.vaultAddress ?? "")
      : (getSolanaSigner()?.publicKey.toBase58() ?? "");
    if (!vault) return null;
    return {
      url: squadsQueueUrl(vault),
      title: SQUADS_PROPOSAL_CONFIRM_MESSAGE,
      label: SQUADS_PROPOSAL_QUEUE_LINK_LABEL,
    };
  }
  return null;
}
