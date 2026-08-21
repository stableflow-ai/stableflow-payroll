export const DRAWER_SIDE = {
  Top: "top",
  Right: "right",
  Bottom: "bottom",
  Left: "left",
} as const;

export type DrawerSide = (typeof DRAWER_SIDE)[keyof typeof DRAWER_SIDE];
