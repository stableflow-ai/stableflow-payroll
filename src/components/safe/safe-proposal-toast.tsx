import { safeQueueUrl } from "@/config/chains";
import type useToast from "@/hooks/use-toast";
import type { ToastHandle } from "@/hooks/use-toast";
import {
  SAFE_PROPOSAL_QUEUE_LINK_LABEL,
  SAFE_PROPOSAL_SUBMITTED_MESSAGE,
} from "@/wallet/evm/safe";

type ToastApi = ReturnType<typeof useToast>;

export function showSafeProposalToast(
  toast: ToastApi,
  input: { chainId: number; safeAddress: string },
): void {
  const url = safeQueueUrl(input.chainId, input.safeAddress);
  let handle: ToastHandle | undefined;
  handle = toast.info({
    title: SAFE_PROPOSAL_SUBMITTED_MESSAGE,
    text: url ? (
      <a href={url} target="_blank" rel="noreferrer" onClick={() => handle?.dismiss()}>
        {SAFE_PROPOSAL_QUEUE_LINK_LABEL}
      </a>
    ) : undefined,
    duration: false,
  });
}
