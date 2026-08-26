import type { CSSProperties, RefObject } from "react";
import { useCallback, useLayoutEffect, useState } from "react";

export const FLOATING_SIDE = {
  Top: "top",
  TopLeft: "top-left",
  TopRight: "top-right",
  Right: "right",
  RightTop: "right-top",
  RightBottom: "right-bottom",
  Bottom: "bottom",
  BottomLeft: "bottom-left",
  BottomRight: "bottom-right",
  Left: "left",
  LeftTop: "left-top",
  LeftBottom: "left-bottom",
} as const;

export type FloatingSide = (typeof FLOATING_SIDE)[keyof typeof FLOATING_SIDE];

export const FLOATING_ALIGN = {
  Start: "start",
  Center: "center",
  End: "end",
} as const;

export type FloatingAlign = (typeof FLOATING_ALIGN)[keyof typeof FLOATING_ALIGN];

const CARDINAL_SIDE = {
  Top: FLOATING_SIDE.Top,
  Right: FLOATING_SIDE.Right,
  Bottom: FLOATING_SIDE.Bottom,
  Left: FLOATING_SIDE.Left,
} as const;

export type CardinalSide = (typeof CARDINAL_SIDE)[keyof typeof CARDINAL_SIDE];

const VIEWPORT_PADDING = 8;

const HIDDEN_STYLE: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  visibility: "hidden",
  pointerEvents: "none",
};

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
  const [style, setStyle] = useState<CSSProperties>(HIDDEN_STYLE);

  const update = useCallback(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return false;

    const triggerRect = trigger.getBoundingClientRect();
    const panelRect = measurePanelRect(panel);
    setStyle(getClampedFloatingStyle(triggerRect, panelRect, side, align, offset));
    return true;
  }, [align, offset, panelRef, side, triggerRef]);

  useLayoutEffect(() => {
    if (!open) {
      setStyle(HIDDEN_STYLE);
      return;
    }
    if (update()) return;
    const frame = window.requestAnimationFrame(() => {
      update();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, update]);

  useLayoutEffect(() => {
    if (!open) return;
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [open, update]);

  return style;
}

function measurePanelRect(panel: HTMLElement): DOMRect {
  const previous = {
    position: panel.style.position,
    top: panel.style.top,
    left: panel.style.left,
    width: panel.style.width,
    visibility: panel.style.visibility,
    pointerEvents: panel.style.pointerEvents,
  };
  panel.style.position = "fixed";
  panel.style.top = "0px";
  panel.style.left = "0px";
  panel.style.visibility = "hidden";
  panel.style.pointerEvents = "none";
  // Drop the helper's inline width so className constraints (e.g. w-[285px]) apply.
  panel.style.width = "";
  const rect = panel.getBoundingClientRect();
  panel.style.position = previous.position;
  panel.style.top = previous.top;
  panel.style.left = previous.left;
  panel.style.width = previous.width;
  panel.style.visibility = previous.visibility;
  panel.style.pointerEvents = previous.pointerEvents;
  return rect;
}

export function resolveFloatingPlacement(
  side: FloatingSide,
  align: FloatingAlign,
): { side: CardinalSide; align: FloatingAlign } {
  switch (side) {
    case FLOATING_SIDE.TopLeft:
      return { side: CARDINAL_SIDE.Top, align: FLOATING_ALIGN.Start };
    case FLOATING_SIDE.TopRight:
      return { side: CARDINAL_SIDE.Top, align: FLOATING_ALIGN.End };
    case FLOATING_SIDE.BottomLeft:
      return { side: CARDINAL_SIDE.Bottom, align: FLOATING_ALIGN.Start };
    case FLOATING_SIDE.BottomRight:
      return { side: CARDINAL_SIDE.Bottom, align: FLOATING_ALIGN.End };
    case FLOATING_SIDE.LeftTop:
      return { side: CARDINAL_SIDE.Left, align: FLOATING_ALIGN.Start };
    case FLOATING_SIDE.LeftBottom:
      return { side: CARDINAL_SIDE.Left, align: FLOATING_ALIGN.End };
    case FLOATING_SIDE.RightTop:
      return { side: CARDINAL_SIDE.Right, align: FLOATING_ALIGN.Start };
    case FLOATING_SIDE.RightBottom:
      return { side: CARDINAL_SIDE.Right, align: FLOATING_ALIGN.End };
    default:
      return { side, align };
  }
}

export function getFloatingCoords(
  trigger: Pick<DOMRect, "top" | "right" | "bottom" | "left" | "width" | "height">,
  panel: Pick<DOMRect, "width" | "height">,
  side: FloatingSide,
  align: FloatingAlign,
  offset: number,
): { top: number; left: number } {
  const placement = resolveFloatingPlacement(side, align);

  if (placement.side === CARDINAL_SIDE.Bottom) {
    return {
      top: trigger.bottom + offset,
      left: getAlignedLeft(trigger, panel.width, placement.align),
    };
  }
  if (placement.side === CARDINAL_SIDE.Top) {
    return {
      top: trigger.top - panel.height - offset,
      left: getAlignedLeft(trigger, panel.width, placement.align),
    };
  }
  if (placement.side === CARDINAL_SIDE.Left) {
    return {
      top: getAlignedTop(trigger, panel.height, placement.align),
      left: trigger.left - panel.width - offset,
    };
  }
  return {
    top: getAlignedTop(trigger, panel.height, placement.align),
    left: trigger.right + offset,
  };
}

function getClampedFloatingStyle(
  trigger: DOMRect,
  panel: DOMRect,
  side: FloatingSide,
  align: FloatingAlign,
  offset: number,
): CSSProperties {
  let { top, left } = getFloatingCoords(trigger, panel, side, align, offset);
  const maxLeft = window.innerWidth - panel.width - VIEWPORT_PADDING;
  const maxTop = window.innerHeight - panel.height - VIEWPORT_PADDING;
  left = clamp(left, VIEWPORT_PADDING, Math.max(VIEWPORT_PADDING, maxLeft));
  top = clamp(top, VIEWPORT_PADDING, Math.max(VIEWPORT_PADDING, maxTop));

  return {
    position: "fixed",
    top,
    left,
    visibility: "visible",
  };
}

type Box = Pick<DOMRect, "top" | "right" | "bottom" | "left" | "width" | "height">;

function getAlignedLeft(trigger: Box, panelWidth: number, align: FloatingAlign) {
  if (align === FLOATING_ALIGN.Center) {
    return trigger.left + trigger.width / 2 - panelWidth / 2;
  }
  if (align === FLOATING_ALIGN.End) {
    return trigger.right - panelWidth;
  }
  return trigger.left;
}

function getAlignedTop(trigger: Box, panelHeight: number, align: FloatingAlign) {
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
