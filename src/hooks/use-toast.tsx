import type { ReactNode } from "react";
import { toast, type Id } from "react-toastify";
import Toast, { ToastType } from "@/components/ui/toast/Toast";

const TOAST_POSITION = "bottom-right" as const;
const TOAST_CLASSNAME = "decash-toast decash-toast-bottom-right";

export interface ToastParams {
  title: ReactNode;
  text?: ReactNode;
  duration?: number | false;
}

export type ToastHandle = {
  id: Id;
  update: (params: Partial<ToastParams>) => void;
  dismiss: () => void;
};

export default function useToast() {
  const success = (params: ToastParams) => showToast(ToastType.Success, params);
  const fail = (params: ToastParams) => showToast(ToastType.Error, params);
  const info = (params: ToastParams) => showToast(ToastType.Info, params);
  const loading = (params: ToastParams) => showToast(ToastType.Pending, params);
  const notice = (params: ToastParams) => showToast(ToastType.Notice, params);

  return {
    success,
    fail,
    info,
    loading,
    notice,
    dismiss: toast.dismiss,
  };
}

function showToast(type: ToastType, params: ToastParams): ToastHandle {
  let current: ToastParams = { ...params };
  const { duration = 3000, title, text } = params;

  const id = toast(<Toast type={type} title={title} text={text} />, {
    position: TOAST_POSITION,
    className: TOAST_CLASSNAME,
    autoClose: duration,
  });

  return {
    id,
    update: (next) => {
      current = { ...current, ...next };
      toast.update(id, {
        render: <Toast type={type} title={current.title} text={current.text} />,
        ...(next.duration !== undefined ? { autoClose: next.duration } : {}),
      });
    },
    dismiss: () => {
      toast.dismiss(id);
    },
  };
}
