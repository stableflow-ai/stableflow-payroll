import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Overlay } from "@/components/ui/overlay/Overlay";
import { OverlayPanel } from "@/components/ui/overlay/OverlayPanel";
import {
  OVERLAY_MASK_FADE_SECONDS,
  OVERLAY_PANEL_SLIDE_SECONDS,
} from "@/components/ui/overlay/config";
import type { OverlayChromeProps } from "@/components/ui/overlay/types";
import { DRAWER_SIDE, type DrawerSide } from "./config";

export type DrawerProps = OverlayChromeProps & {
  side?: DrawerSide;
};

export function Drawer(props: DrawerProps) {
  const {
    open,
    onClose,
    title,
    children,
    mask = true,
    maskClassName,
    closeOnMaskClick = true,
    cardClassName,
    panelClassName,
    titleClassName,
    closeClassName,
    closeIcon,
    headerAction,
    side = DRAWER_SIDE.Right,
  } = props;
  const hidden = slideHidden(side);

  return (
    <Overlay
      type="drawer"
      open={open}
      onClose={onClose}
      mask={mask}
      maskClassName={maskClassName}
      closeOnMaskClick={closeOnMaskClick}
    >
      <motion.div
        className={cn("pointer-events-auto", getDrawerPositionClassName(side), panelClassName)}
        initial={hidden}
        animate={{
          x: 0,
          y: 0,
          transition: { duration: OVERLAY_PANEL_SLIDE_SECONDS, delay: OVERLAY_MASK_FADE_SECONDS, ease: easeOut },
        }}
        exit={{
          ...hidden,
          transition: { duration: OVERLAY_PANEL_SLIDE_SECONDS, delay: 0, ease: easeOut },
        }}
      >
        <OverlayPanel
          title={title}
          titleClassName={titleClassName}
          closeClassName={closeClassName}
          closeIcon={closeIcon}
          headerAction={headerAction}
          onClose={onClose}
          cardClassName={cn(getDrawerPanelClassName(side), cardClassName)}
        >
          {children}
        </OverlayPanel>
      </motion.div>
    </Overlay>
  );
}

export default Drawer;

const easeOut: [number, number, number, number] = [0.32, 0.72, 0, 1];

function slideHidden(side: DrawerSide): { x?: string; y?: string } {
  if (side === DRAWER_SIDE.Top) return { y: "-100%" };
  if (side === DRAWER_SIDE.Bottom) return { y: "100%" };
  if (side === DRAWER_SIDE.Left) return { x: "-100%" };
  return { x: "100%" };
}

function getDrawerPositionClassName(side: DrawerSide) {
  if (side === DRAWER_SIDE.Top) {
    return "absolute inset-x-0 top-0";
  }
  if (side === DRAWER_SIDE.Bottom) {
    return "absolute inset-x-0 bottom-0";
  }
  if (side === DRAWER_SIDE.Left) {
    return "absolute inset-y-0 left-0 h-full w-[min(100%,420px)]";
  }
  return "absolute inset-y-0 right-0 h-full w-[min(100%,420px)]";
}

function getDrawerPanelClassName(side: DrawerSide) {
  if (side === DRAWER_SIDE.Top) {
    return "w-full max-h-[90vh] rounded-t-none";
  }
  if (side === DRAWER_SIDE.Bottom) {
    return "w-full max-h-[90vh] rounded-b-none";
  }
  if (side === DRAWER_SIDE.Left) {
    return "h-full w-full rounded-l-none";
  }
  return "h-full w-full rounded-r-none";
}
