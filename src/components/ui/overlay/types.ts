import type { ReactNode } from "react";

export type OverlayChromeProps = {
  open: boolean;
  onClose?: () => void;
  title?: ReactNode;
  children?: ReactNode;
  mask?: boolean;
  maskClassName?: string;
  closeOnMaskClick?: boolean;
  cardClassName?: string;
  titleClassName?: string;
  closeClassName?: string;
  closeIcon?: ReactNode;
};
