import type { CSSProperties, ReactNode } from "react";
import { IconClose } from "@/components/icons/close";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card/Card";

export type OverlayPanelProps = {
  title?: ReactNode;
  titleClassName?: string;
  closeClassName?: string;
  closeIcon?: ReactNode;
  onClose?: () => void;
  cardClassName?: string;
  children?: ReactNode;
  style?: CSSProperties;
};

export function OverlayPanel(props: OverlayPanelProps) {
  const {
    title,
    titleClassName,
    closeClassName,
    closeIcon,
    onClose,
    cardClassName,
    children,
    style,
  } = props;

  return (
    <Card
      role="dialog"
      aria-modal="true"
      className={cn("relative flex flex-col gap-5", cardClassName)}
      style={style}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex shrink-0 items-center justify-between gap-4">
        <h2
          className={cn(
            "min-h-5 font-montserrat text-[20px] font-semibold leading-normal text-black",
            titleClassName,
          )}
        >
          {title}
        </h2>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className={cn("shrink-0 cursor-pointer text-black", closeClassName)}
        >
          {closeIcon ?? <IconClose className="size-3.25" />}
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </Card>
  );
}

export default OverlayPanel;
