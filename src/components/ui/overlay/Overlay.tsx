import type { ReactNode } from "react";
import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  OVERLAY_DIALOG_PANEL_FADE_SECONDS,
  OVERLAY_EXIT_SECONDS,
  OVERLAY_MASK_FADE_SECONDS,
  OVERLAY_PANEL_SLIDE_SECONDS,
} from "./config";
import { isTopOverlay } from "./stack";
import { useOverlayLayer } from "./use-overlay-layer";

export type OverlayProps = {
  type?: "dialog" | "drawer";
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
    type = "dialog",
    open,
    onClose,
    mask = true,
    maskClassName,
    closeOnMaskClick = true,
    children,
    className,
  } = props;
  const [present, setPresent] = useState(open);

  useLayoutEffect(() => {
    if (open) setPresent(true);
  }, [open]);

  const zIndex = useOverlayLayer(open || present);

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

  if (typeof document === "undefined") {
    return null;
  }

  if (!open && !present) {
    return null;
  }

  return createPortal(
    <AnimatePresence onExitComplete={() => setPresent(false)}>
      {open ? (
        <motion.div
          key="overlay-root"
          className={cn("fixed inset-0 overflow-hidden", !mask && "pointer-events-none", className)}
          style={{ zIndex }}
          role="presentation"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 1 }}
          transition={{ duration: OVERLAY_EXIT_SECONDS }}
        >
          <motion.div
            className={cn(
              "absolute inset-0",
              mask ? "bg-[rgba(0,0,0,0.50)]" : "bg-transparent",
              !closeOnMaskClick && "pointer-events-none",
              maskClassName,
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: OVERLAY_MASK_FADE_SECONDS, delay: 0 } }}
            exit={{
              opacity: 0,
              transition: {
                duration: OVERLAY_MASK_FADE_SECONDS,
                delay: type === "drawer"
                  ? OVERLAY_PANEL_SLIDE_SECONDS
                  : OVERLAY_DIALOG_PANEL_FADE_SECONDS,
              },
            }}
            onClick={closeOnMaskClick ? onClose : undefined}
          />
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

export default Overlay;
