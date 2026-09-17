import type { ReactNode } from "react";
import type useToast from "@/hooks/use-toast";
import type { ToastHandle } from "@/hooks/use-toast";
import {
  MULTISIG_LISTEN_TITLE,
  MULTISIG_SIGNED_LABEL,
} from "@/wallet/multisig/config";
import type { MultisigConfirmCopy } from "@/wallet/multisig/types";

type ToastApi = ReturnType<typeof useToast>;

export function showMultisigConfirmToast(
  toast: ToastApi,
  copy: MultisigConfirmCopy,
): ToastHandle {
  let handle: ToastHandle | undefined;
  handle = toast.info({
    title: copy.title,
    text: copy.url ? (
      <a href={copy.url} target="_blank" rel="noreferrer" onClick={() => handle?.dismiss()}>
        {copy.label}
      </a>
    ) : undefined,
    duration: false,
  });
  return handle;
}

export function listenToastText(signed: number | null, required: number | null): ReactNode {
  if (signed == null || required == null) return undefined;
  return (
    <span>
      <span className="text-[#003bff]">{signed} / {required} </span>
      {MULTISIG_SIGNED_LABEL}
    </span>
  );
}

export function showMultisigListenToast(
  toast: ToastApi,
  input: {
    signed: number | null;
    required: number | null;
    onClose: () => void;
  },
): ToastHandle {
  return toast.info({
    title: MULTISIG_LISTEN_TITLE,
    text: listenToastText(input.signed, input.required),
    duration: false,
    onClose: input.onClose,
  });
}
