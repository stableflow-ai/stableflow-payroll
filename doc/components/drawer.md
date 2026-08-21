# Drawer

Path: `src/components/ui/drawer/Drawer.tsx`

Same chrome as [Dialog](dialog.md) (Card panel, title row, close icon, mask, stacking, scrollable body). Slides from one edge instead of centering.

## Props

All Dialog chrome props, plus:

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `side` | `"top" \| "right" \| "bottom" \| "left"` | `"right"` | Use `DRAWER_SIDE` from `./config` |
| `cardClassName` | `string` | — | Override width, radius, height |

Edge defaults:

- `top` / `bottom`: `width: 100%`, `max-h-[90vh]`, square corners on the screen edge
- `left` / `right`: `h-full`, default `w-[min(100%,420px)]`, square corners on the screen edge

Mask, close, and title APIs match Dialog (`mask`, `maskClassName`, `closeOnMaskClick`, `titleClassName`, `closeClassName`, `closeIcon`).

## Example

```tsx
import { Drawer } from "@/components/ui/drawer/Drawer";
import { DRAWER_SIDE } from "@/components/ui/drawer/config";

<Drawer
  open={open}
  onClose={() => setOpen(false)}
  side={DRAWER_SIDE.Left}
  title="Filters"
  cardClassName="w-[min(100%,360px)]"
>
  Filter content
</Drawer>
```

## Notes

- Dialog on mobile is implemented as `Drawer` with `side="bottom"`.
- Overlays stack with Dialog instances (shared z-index stack).
