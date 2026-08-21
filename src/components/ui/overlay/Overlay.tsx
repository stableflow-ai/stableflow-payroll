import type { ReactNode } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { isTopOverlay } from "./stack";
import { useOverlayLayer } from "./use-overlay-layer";

export type OverlayProps = {
  open: boolean;
  onClose?: () => void;
  mask?: boolean;
  maskClassName?: string;
  closeOnMaskClick?: boolean;
  children?: ReactNode;
  className?: string;
};

export function Overlay(props: OverlayProps) {
  const {
    open,
    onClose,
    mask = true,
    maskClassName,
    closeOnMaskClick = true,
    children,
    className,
  } = props;
  const zIndex = useOverlayLayer(open);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (!isTopOverlay(zIndex)) return;
      onClose?.();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, zIndex]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className={cn("fixed inset-0", className)}
      style={{ zIndex }}
      role="presentation"
    >
      <div
        className={cn(
          "absolute inset-0",
          mask ? "bg-[rgba(0,0,0,0.50)]" : "bg-transparent",
          !closeOnMaskClick && "pointer-events-none",
          maskClassName,
        )}
        onClick={closeOnMaskClick ? onClose : undefined}
      />
      {children}
    </div>,
    document.body,
  );
}

export default Overlay;
