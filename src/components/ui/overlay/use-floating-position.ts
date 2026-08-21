import type { CSSProperties, RefObject } from "react";
import { useCallback, useLayoutEffect, useState } from "react";

export const FLOATING_SIDE = {
  Top: "top",
  Right: "right",
  Bottom: "bottom",
  Left: "left",
} as const;

export type FloatingSide = (typeof FLOATING_SIDE)[keyof typeof FLOATING_SIDE];

export const FLOATING_ALIGN = {
  Start: "start",
  Center: "center",
  End: "end",
} as const;

export type FloatingAlign = (typeof FLOATING_ALIGN)[keyof typeof FLOATING_ALIGN];

const VIEWPORT_PADDING = 8;

export function useFloatingPosition(options: {
  open: boolean;
  triggerRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLElement | null>;
  side?: FloatingSide;
  align?: FloatingAlign;
  offset?: number;
}) {
  const {
    open,
    triggerRef,
    panelRef,
    side = FLOATING_SIDE.Bottom,
    align = FLOATING_ALIGN.Start,
    offset = 8,
  } = options;
  const [style, setStyle] = useState<CSSProperties>({});

  const update = useCallback(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;

    const triggerRect = trigger.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const next = getFloatingStyle(triggerRect, panelRect, side, align, offset);
    setStyle(next);
  }, [align, offset, panelRef, side, triggerRef]);

  useLayoutEffect(() => {
    if (!open) return;
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [open, update]);

  return style;
}

function getFloatingStyle(
  trigger: DOMRect,
  panel: DOMRect,
  side: FloatingSide,
  align: FloatingAlign,
  offset: number,
): CSSProperties {
  let top = 0;
  let left = 0;

  if (side === FLOATING_SIDE.Bottom) {
    top = trigger.bottom + offset;
    left = getAlignedLeft(trigger, panel.width, align);
  } else if (side === FLOATING_SIDE.Top) {
    top = trigger.top - panel.height - offset;
    left = getAlignedLeft(trigger, panel.width, align);
  } else if (side === FLOATING_SIDE.Left) {
    top = getAlignedTop(trigger, panel.height, align);
    left = trigger.left - panel.width - offset;
  } else {
    top = getAlignedTop(trigger, panel.height, align);
    left = trigger.right + offset;
  }

  const maxLeft = window.innerWidth - panel.width - VIEWPORT_PADDING;
  const maxTop = window.innerHeight - panel.height - VIEWPORT_PADDING;
  left = clamp(left, VIEWPORT_PADDING, Math.max(VIEWPORT_PADDING, maxLeft));
  top = clamp(top, VIEWPORT_PADDING, Math.max(VIEWPORT_PADDING, maxTop));

  return {
    position: "fixed",
    top,
    left,
  };
}

function getAlignedLeft(trigger: DOMRect, panelWidth: number, align: FloatingAlign) {
  if (align === FLOATING_ALIGN.Center) {
    return trigger.left + trigger.width / 2 - panelWidth / 2;
  }
  if (align === FLOATING_ALIGN.End) {
    return trigger.right - panelWidth;
  }
  return trigger.left;
}

function getAlignedTop(trigger: DOMRect, panelHeight: number, align: FloatingAlign) {
  if (align === FLOATING_ALIGN.Center) {
    return trigger.top + trigger.height / 2 - panelHeight / 2;
  }
  if (align === FLOATING_ALIGN.End) {
    return trigger.bottom - panelHeight;
  }
  return trigger.top;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
