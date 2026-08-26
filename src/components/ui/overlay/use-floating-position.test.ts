import { describe, expect, it } from "vitest";
import {
  FLOATING_ALIGN,
  FLOATING_SIDE,
  getFloatingCoords,
  resolveFloatingPlacement,
} from "./use-floating-position";

function triggerBox(left: number, top: number, width: number, height: number) {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  };
}

const trigger = triggerBox(100, 100, 40, 20);
const panel = { width: 80, height: 30 };
const offset = 8;

describe("resolveFloatingPlacement", () => {
  it("keeps cardinal sides and the passed align", () => {
    expect(resolveFloatingPlacement(FLOATING_SIDE.Top, FLOATING_ALIGN.Center)).toEqual({
      side: FLOATING_SIDE.Top,
      align: FLOATING_ALIGN.Center,
    });
    expect(resolveFloatingPlacement(FLOATING_SIDE.Left, FLOATING_ALIGN.Start)).toEqual({
      side: FLOATING_SIDE.Left,
      align: FLOATING_ALIGN.Start,
    });
  });

  it("maps composite sides to cardinal + edge align and ignores passed align", () => {
    expect(resolveFloatingPlacement(FLOATING_SIDE.TopLeft, FLOATING_ALIGN.Center)).toEqual({
      side: FLOATING_SIDE.Top,
      align: FLOATING_ALIGN.Start,
    });
    expect(resolveFloatingPlacement(FLOATING_SIDE.TopRight, FLOATING_ALIGN.Start)).toEqual({
      side: FLOATING_SIDE.Top,
      align: FLOATING_ALIGN.End,
    });
    expect(resolveFloatingPlacement(FLOATING_SIDE.LeftBottom, FLOATING_ALIGN.Center)).toEqual({
      side: FLOATING_SIDE.Left,
      align: FLOATING_ALIGN.End,
    });
    expect(resolveFloatingPlacement(FLOATING_SIDE.RightTop, FLOATING_ALIGN.End)).toEqual({
      side: FLOATING_SIDE.Right,
      align: FLOATING_ALIGN.Start,
    });
  });
});

describe("getFloatingCoords", () => {
  it("centers Top horizontally above the trigger", () => {
    expect(
      getFloatingCoords(trigger, panel, FLOATING_SIDE.Top, FLOATING_ALIGN.Center, offset),
    ).toEqual({
      top: 62,
      left: 80,
    });
  });

  it("aligns TopLeft to the left edges", () => {
    expect(
      getFloatingCoords(trigger, panel, FLOATING_SIDE.TopLeft, FLOATING_ALIGN.Center, offset),
    ).toEqual({
      top: 62,
      left: 100,
    });
  });

  it("aligns LeftBottom to the bottom edges", () => {
    expect(
      getFloatingCoords(trigger, panel, FLOATING_SIDE.LeftBottom, FLOATING_ALIGN.Center, offset),
    ).toEqual({
      top: 90,
      left: 12,
    });
  });

  it("keeps cardinal Top start-aligned when align is start", () => {
    expect(
      getFloatingCoords(trigger, panel, FLOATING_SIDE.Top, FLOATING_ALIGN.Start, offset),
    ).toEqual({
      top: 62,
      left: 100,
    });
  });
});
