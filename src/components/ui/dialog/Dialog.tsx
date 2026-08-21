import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Overlay } from "@/components/ui/overlay/Overlay";
import { OverlayPanel } from "@/components/ui/overlay/OverlayPanel";
import { DESKTOP_MEDIA_QUERY } from "@/components/ui/overlay/config";
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
        <div className="pointer-events-auto">
          <OverlayPanel
            title={title}
            titleClassName={titleClassName}
            closeClassName={closeClassName}
            closeIcon={closeIcon}
            onClose={onClose}
            cardClassName={cn("w-[min(100%,500px)] max-h-[90vh]", cardClassName)}
          >
            {children}
          </OverlayPanel>
        </div>
      </div>
    </Overlay>
  );
}

export default Dialog;
