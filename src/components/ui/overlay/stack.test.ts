import { afterEach, describe, expect, it } from "vitest";
import {
  FLOATING_LAYER_Z_INDEX,
  OVERLAY_BASE_Z_INDEX,
  OVERLAY_Z_INDEX_STEP,
} from "./config";
import {
  acquireOverlayLayer,
  floatingLayerZIndex,
  releaseOverlayLayer,
} from "./stack";

describe("overlay stack", () => {
  afterEach(() => {
    for (let i = 0; i < 20; i += 1) {
      const z = OVERLAY_BASE_Z_INDEX + (i + 1) * OVERLAY_Z_INDEX_STEP;
      releaseOverlayLayer(z);
    }
  });

  it("resets layer sequence after every overlay closes", () => {
    const first = acquireOverlayLayer();
    const second = acquireOverlayLayer();
    expect(first).toBe(OVERLAY_BASE_Z_INDEX + OVERLAY_Z_INDEX_STEP);
    expect(second).toBe(OVERLAY_BASE_Z_INDEX + OVERLAY_Z_INDEX_STEP * 2);
    releaseOverlayLayer(second);
    releaseOverlayLayer(first);
    expect(acquireOverlayLayer()).toBe(OVERLAY_BASE_Z_INDEX + OVERLAY_Z_INDEX_STEP);
  });

  it("places floating layers above the current overlay", () => {
    expect(floatingLayerZIndex()).toBe(FLOATING_LAYER_Z_INDEX);
    const overlay = acquireOverlayLayer();
    expect(floatingLayerZIndex()).toBe(overlay + OVERLAY_Z_INDEX_STEP);
  });
});
