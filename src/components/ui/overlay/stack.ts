import { OVERLAY_BASE_Z_INDEX, OVERLAY_Z_INDEX_STEP } from "./config";

let layerSeq = 0;
const openLayers: number[] = [];
let previousBodyOverflow: string | null = null;

function lockBodyScroll() {
  if (typeof document === "undefined") return;
  previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
}

function unlockBodyScroll() {
  if (typeof document === "undefined") return;
  document.body.style.overflow = previousBodyOverflow ?? "";
  previousBodyOverflow = null;
}

export function acquireOverlayLayer(): number {
  layerSeq += 1;
  const zIndex = OVERLAY_BASE_Z_INDEX + layerSeq * OVERLAY_Z_INDEX_STEP;
  openLayers.push(zIndex);
  if (openLayers.length === 1) {
    lockBodyScroll();
  }
  return zIndex;
}

export function releaseOverlayLayer(zIndex: number) {
  const index = openLayers.lastIndexOf(zIndex);
  if (index >= 0) {
    openLayers.splice(index, 1);
  }
  if (openLayers.length === 0) {
    unlockBodyScroll();
  }
}

export function isTopOverlay(zIndex: number) {
  return openLayers[openLayers.length - 1] === zIndex;
}
