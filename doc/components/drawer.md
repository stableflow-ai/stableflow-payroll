# Drawer

Path: `src/components/ui/drawer/Drawer.tsx`

Edge-anchored panel over a backdrop. Shares all chrome with [Dialog](dialog.md) — same overlay, same [Card](card.md) panel, same header row, same z-index stack and Escape handling — and adds a `side`.

Dialog renders a bottom Drawer below `768px`, so a Drawer is also what mobile users see for most modals.

Open: mask fades in first, then the panel slides in from its edge. Close: the panel slides back off that edge, then the mask fades out. Durations live in [`overlay/config.ts`](../../src/components/ui/overlay/config.ts) (`OVERLAY_MASK_FADE_SECONDS`, `OVERLAY_PANEL_SLIDE_SECONDS`). Overlay stays mounted through the exit so the slide can finish.

## Sides

| `side` | Geometry |
| --- | --- |
| `right` (default) | Full height, shell `width: min(100%, 420px)`, square right edge |
| `left` | Full height, shell `width: min(100%, 420px)`, square left edge |
| `top` | Full width, `max-height: 90vh`, square top edge |
| `bottom` | Full width, `max-height: 90vh`, square bottom edge |

Constants: `DRAWER_SIDE` and the `DrawerSide` type in `./config`.

Right/left default width is on the positioned **shell**. The Card is `w-full`. Wider drawers set `panelClassName`, not `cardClassName`.

## Props

`DrawerProps = OverlayChromeProps & { side?: DrawerSide }`. See the [Dialog props table](dialog.md#props) for the shared entries.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `side` | `"top" \| "right" \| "bottom" \| "left"` | `"right"` | |
| `panelClassName` | `string` | — | Override the positioned shell width (right/left default `w-[min(100%,420px)]`) |

## Example

```tsx
import { Drawer } from "@/components/ui/drawer/Drawer";
import { DRAWER_SIDE } from "@/components/ui/drawer/config";

<Drawer
  open={menuOpen}
  onClose={() => setMenuOpen(false)}
  side={DRAWER_SIDE.Left}
  title="Menu"
>
  {navigation}
</Drawer>
```

## Notes

- Use Drawer for sidebars, menus, and filter panels on narrow viewports. Do not build a second mobile navigation system.
- The panel keeps Card padding; pass `cardClassName="p-0"` for edge-to-edge content.
- Overlay `mask={false}` uses `pointer-events-none` on the root so the page behind stays clickable; the panel is `pointer-events-auto`.
