import { cn } from "@/lib/utils";
import { Overlay } from "@/components/ui/overlay/Overlay";
import { OverlayPanel } from "@/components/ui/overlay/OverlayPanel";
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
    titleClassName,
    closeClassName,
    closeIcon,
    headerAction,
    side = DRAWER_SIDE.Right,
  } = props;

  return (
    <Overlay
      open={open}
      onClose={onClose}
      mask={mask}
      maskClassName={maskClassName}
      closeOnMaskClick={closeOnMaskClick}
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
    </Overlay>
  );
}

export default Drawer;

function getDrawerPanelClassName(side: DrawerSide) {
  if (side === DRAWER_SIDE.Top) {
    return "absolute inset-x-0 top-0 w-full max-h-[90vh] rounded-t-none";
  }
  if (side === DRAWER_SIDE.Bottom) {
    return "absolute inset-x-0 bottom-0 w-full max-h-[90vh] rounded-b-none";
  }
  if (side === DRAWER_SIDE.Left) {
    return "absolute inset-y-0 left-0 h-full w-[min(100%,420px)] rounded-l-none";
  }
  return "absolute inset-y-0 right-0 h-full w-[min(100%,420px)] rounded-r-none";
}
