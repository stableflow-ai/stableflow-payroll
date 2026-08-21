import { toast } from "react-toastify";
import Toast, { ToastType } from "@/components/ui/toast/Toast";

const TOAST_POSITION = "top-right" as const;
const TOAST_CLASSNAME = "decash-toast decash-toast-top-right";

interface ToastParams {
  title: string;
  text?: string;
  duration?: number | false;
}

export default function useToast() {
  const success = (params: ToastParams) => {
    const { duration = 3000, ...rest } = params;
    return toast(<Toast type={ToastType.Success} {...rest} />, {
      position: TOAST_POSITION,
      className: TOAST_CLASSNAME,
      autoClose: duration,
    });
  };

  const fail = (params: ToastParams) => {
    const { duration = 3000, ...rest } = params;
    return toast(<Toast type={ToastType.Error} {...rest} />, {
      position: TOAST_POSITION,
      className: TOAST_CLASSNAME,
      autoClose: duration,
    });
  };

  const info = (params: ToastParams) => {
    const { duration = 3000, ...rest } = params;
    return toast(<Toast type={ToastType.Info} {...rest} />, {
      position: TOAST_POSITION,
      className: TOAST_CLASSNAME,
      autoClose: duration,
    });
  };

  const loading = (params: ToastParams) => {
    const { duration = 3000, ...rest } = params;
    return toast(<Toast type={ToastType.Pending} {...rest} />, {
      position: TOAST_POSITION,
      className: TOAST_CLASSNAME,
      autoClose: duration,
    });
  };

  const notice = (params: ToastParams) => {
    const { duration = 3000, ...rest } = params;
    return toast(<Toast type={ToastType.Notice} {...rest} />, {
      position: TOAST_POSITION,
      className: TOAST_CLASSNAME,
      autoClose: duration,
    });
  };

  return {
    success,
    fail,
    info,
    loading,
    notice,
    dismiss: toast.dismiss,
  };
}
