import { safeQueueUrl, squadsQueueUrl, trezuRequestsUrl } from "@/config/chains";
import type useToast from "@/hooks/use-toast";
import type { ToastHandle } from "@/hooks/use-toast";
import {
  SAFE_PROPOSAL_QUEUE_LINK_LABEL,
  SAFE_PROPOSAL_SUBMITTED_MESSAGE,
} from "@/wallet/evm/safe";
import {
  TREZU_PROPOSAL_QUEUE_LINK_LABEL,
  TREZU_PROPOSAL_SUBMITTED_MESSAGE,
} from "@/wallet/near/multisig";
import {
  SQUADS_PROPOSAL_QUEUE_LINK_LABEL,
  SQUADS_PROPOSAL_SUBMITTED_MESSAGE,
} from "@/wallet/solana/multisig";
import type { PendingMultisigBroadcast } from "@/wallet/types";

type ToastApi = ReturnType<typeof useToast>;

function proposalToastCopy(result: PendingMultisigBroadcast): {
  url: string | null;
  title: string;
  label: string;
} {
  if (result.chainKind === "solana") {
    return {
      url: squadsQueueUrl(result.vaultAddress),
      title: SQUADS_PROPOSAL_SUBMITTED_MESSAGE,
      label: SQUADS_PROPOSAL_QUEUE_LINK_LABEL,
    };
  }
  if (result.chainKind === "near") {
    return {
      url: trezuRequestsUrl(result.daoId, result.proposalId),
      title: TREZU_PROPOSAL_SUBMITTED_MESSAGE,
      label: TREZU_PROPOSAL_QUEUE_LINK_LABEL,
    };
  }
  return {
    url: safeQueueUrl(result.chainId, result.safeAddress),
    title: SAFE_PROPOSAL_SUBMITTED_MESSAGE,
    label: SAFE_PROPOSAL_QUEUE_LINK_LABEL,
  };
}

export function showMultisigProposalToast(
  toast: ToastApi,
  result: PendingMultisigBroadcast,
): void {
  const { url, title, label } = proposalToastCopy(result);

  let handle: ToastHandle | undefined;
  handle = toast.info({
    title,
    text: url ? (
      <a href={url} target="_blank" rel="noreferrer" onClick={() => handle?.dismiss()}>
        {label}
      </a>
    ) : undefined,
    duration: false,
  });
}
