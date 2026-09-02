# Drawer

Path: `src/components/ui/drawer/Drawer.tsx`

Edge-anchored panel over a backdrop. Shares all chrome with [Dialog](dialog.md) — same overlay, same [Card](card.md) panel, same header row, same z-index stack and Escape handling — and adds a `side`.

Dialog renders a bottom Drawer below `768px`, so a Drawer is also what mobile users see for most modals.

## Sides

| `side` | Geometry |
| --- | --- |
| `right` (default) | Full height, `width: min(100%, 420px)`, square right edge |
| `left` | Full height, `width: min(100%, 420px)`, square left edge |
| `top` | Full width, `max-height: 90vh`, square top edge |
| `bottom` | Full width, `max-height: 90vh`, square bottom edge |

Constants: `DRAWER_SIDE` and the `DrawerSide` type in `./config`.

## Props

`DrawerProps = OverlayChromeProps & { side?: DrawerSide }`. See the [Dialog props table](dialog.md#props) for the shared entries.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `side` | `"top" \| "right" \| "bottom" \| "left"` | `"right"` | |

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
