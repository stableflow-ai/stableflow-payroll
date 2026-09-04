import type { ReactNode } from "react";
import { IconAlert, IconCheck, IconClose, IconLoading } from "@/components/icons";
import { cn } from "@/lib/utils";

export const ToastType = {
  Success: "success",
  Error: "error",
  Info: "info",
  Pending: "pending",
  Notice: "notice",
} as const;
export type ToastType = (typeof ToastType)[keyof typeof ToastType];

interface ToastProps {
  type: ToastType;
  title: ReactNode;
  text?: ReactNode;
  className?: string;
  closeToast?: () => void;
}

export function Toast(props: ToastProps) {
  const { type, title, text, className, closeToast } = props;
  const isSuccess = type === ToastType.Success;
  const isError = type === ToastType.Error;
  const isInfo = type === ToastType.Info;
  const isPending = type === ToastType.Pending;
  const isNotice = type === ToastType.Notice;

  return (
    <div
      className={cn(
        "w-[316px] max-md:w-[calc(100vw-32px)] rounded-xl border border-[#e0e0e0] bg-[#fdfdfd] px-3 py-3.5 shadow-[0_0_20px_0_rgba(0,0,0,0.06)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 font-montserrat text-sm font-semibold leading-normal text-black flex items-start gap-1.5">
          <div
            className={cn(
              "size-3.5 rounded-full text-white flex justify-center items-center shrink-0 translate-y-1",
              isSuccess ? "bg-[#84a20f]" : "",
              isError ? "bg-danger" : "",
              isInfo ? "bg-[#007AFF]" : "",
              isPending ? "bg-[#FF9500]" : "",
              isNotice ? "bg-[#606060]" : "",
            )}
          >
            {isSuccess && (
              <IconCheck className="size-1.5 shrink-0" />
            )}
            {isError && (
              <IconClose className="size-1.5 shrink-0" />
            )}
            {isInfo && (
              <IconAlert className="size-1.5 shrink-0" />
            )}
            {isPending && (
              <IconLoading className="size-2 shrink-0 animate-spin" />
            )}
            {isNotice && (
              <IconAlert className="size-1.5 shrink-0" />
            )}
          </div>
          <div className="">{title}</div>
        </div>
        <button
          type="button"
          className="mt-0.5 shrink-0 cursor-pointer text-black"
          onClick={closeToast}
          aria-label="Close"
        >
          <IconClose className="size-3" />
        </button>
      </div>
      {text ? (
        <div
          className={cn(
            "mt-2.5 flex items-center gap-1 font-montserrat text-xs font-medium leading-normal text-[#606060]",
          )}
        >
          <div className="min-w-0 flex-1">{text}</div>
        </div>
      ) : null}
    </div>
  );
}

export default Toast;
