import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import {
  FLOATING_SIDE,
  type FloatingSide,
  useFloatingPosition,
} from "@/components/ui/overlay/use-floating-position";
import { TOOLTIP_LEAVE_DELAY_MS } from "./config";

export type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  leaveDelay?: number;
  side?: FloatingSide;
  className?: string;
};

export function Tooltip(props: TooltipProps) {
  const {
    content,
    children,
    leaveDelay = TOOLTIP_LEAVE_DELAY_MS,
    side = FLOATING_SIDE.Top,
    className,
  } = props;
  const triggerRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const leaveTimerRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const panelStyle = useFloatingPosition({
    open,
    triggerRef,
    panelRef,
    side,
    offset: 8,
  });

  const clearLeaveTimer = () => {
    if (leaveTimerRef.current == null) return;
    window.clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = null;
  };

  const show = () => {
    clearLeaveTimer();
    setOpen(true);
  };

  const hide = () => {
    clearLeaveTimer();
    if (leaveDelay <= 0) {
      setOpen(false);
      return;
    }
    leaveTimerRef.current = window.setTimeout(() => {
      setOpen(false);
      leaveTimerRef.current = null;
    }, leaveDelay);
  };

  useEffect(() => {
    return () => clearLeaveTimer();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => {
      clearLeaveTimer();
      setOpen(false);
    };
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open]);

  return (
    <>
      <span
        ref={triggerRef}
        className="inline-flex max-w-full"
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        {children}
      </span>
      {open && content && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              role="tooltip"
              style={panelStyle}
              className={cn(
                "z-1100 rounded-[12px] border border-[#E0E0E0] bg-[#FDFDFD] px-[15px] py-2.5 font-montserrat text-sm font-normal leading-normal text-black shadow-[0_0_20px_0_rgba(0,0,0,0.06)]",
                className,
              )}
              onMouseEnter={leaveDelay > 0 ? show : undefined}
              onMouseLeave={leaveDelay > 0 ? hide : undefined}
            >
              {content}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export default Tooltip;
