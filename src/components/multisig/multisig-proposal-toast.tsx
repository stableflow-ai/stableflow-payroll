import { safeQueueUrl, trezuRequestsUrl } from "@/config/chains";
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
import type { PendingMultisigBroadcast } from "@/wallet/types";

type ToastApi = ReturnType<typeof useToast>;

export function showMultisigProposalToast(
  toast: ToastApi,
  result: PendingMultisigBroadcast,
): void {
  const url = result.chainKind === "near"
    ? trezuRequestsUrl(result.daoId, result.proposalId)
    : safeQueueUrl(result.chainId, result.safeAddress);
  const title = result.chainKind === "near"
    ? TREZU_PROPOSAL_SUBMITTED_MESSAGE
    : SAFE_PROPOSAL_SUBMITTED_MESSAGE;
  const label = result.chainKind === "near"
    ? TREZU_PROPOSAL_QUEUE_LINK_LABEL
    : SAFE_PROPOSAL_QUEUE_LINK_LABEL;

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
