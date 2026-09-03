import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Overlay } from "@/components/ui/overlay/Overlay";
import { OverlayPanel } from "@/components/ui/overlay/OverlayPanel";
import {
  DESKTOP_MEDIA_QUERY,
  OVERLAY_DIALOG_PANEL_FADE_SECONDS,
} from "@/components/ui/overlay/config";
import type { OverlayChromeProps } from "@/components/ui/overlay/types";
import { Drawer } from "@/components/ui/drawer/Drawer";
import { DRAWER_SIDE } from "@/components/ui/drawer/config";

export type DialogProps = OverlayChromeProps;

export function Dialog(props: DialogProps) {
  const {
    open,
    onClose,
    title,
    children,
    mask = true,
    maskClassName,
    closeOnMaskClick = true,
    cardClassName,
    titleClassName,
    closeClassName,
    closeIcon,
    headerAction,
  } = props;
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);

  if (!isDesktop) {
    return (
      <Drawer
        {...props}
        side={DRAWER_SIDE.Bottom}
        cardClassName={cn("w-full rounded-b-none", cardClassName)}
      />
    );
  }

  return (
    <Overlay
      open={open}
      onClose={onClose}
      mask={mask}
      maskClassName={maskClassName}
      closeOnMaskClick={closeOnMaskClick}
    >
      <div className="pointer-events-none relative flex size-full items-center justify-center p-4">
        <motion.div
          className="pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            transition: { duration: OVERLAY_DIALOG_PANEL_FADE_SECONDS, delay: 0 },
          }}
          exit={{
            opacity: 0,
            transition: { duration: OVERLAY_DIALOG_PANEL_FADE_SECONDS, delay: 0 },
          }}
        >
          <OverlayPanel
            title={title}
            titleClassName={titleClassName}
            closeClassName={closeClassName}
            closeIcon={closeIcon}
            headerAction={headerAction}
            onClose={onClose}
            cardClassName={cn("w-full md:w-[500px] max-h-[90vh]", cardClassName)}
          >
            {children}
          </OverlayPanel>
        </motion.div>
      </div>
    </Overlay>
  );
}

export default Dialog;
