import { useLayoutEffect, useState } from "react";
import { OVERLAY_BASE_Z_INDEX } from "./config";
import { acquireOverlayLayer, releaseOverlayLayer } from "./stack";

export function useOverlayLayer(open: boolean) {
  const [zIndex, setZIndex] = useState(OVERLAY_BASE_Z_INDEX);

  useLayoutEffect(() => {
    if (!open) return;
    const nextZIndex = acquireOverlayLayer();
    setZIndex(nextZIndex);
    return () => {
      releaseOverlayLayer(nextZIndex);
    };
  }, [open]);

  return zIndex;
}
