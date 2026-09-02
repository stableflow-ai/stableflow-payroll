# Tooltip

Path: `src/components/ui/tooltip/Tooltip.tsx`

Hover tooltip. Wraps its children in an `inline-flex` span and portals the panel to `document.body`, positioned by `useFloatingPosition` and clamped to the viewport with 8px padding.

## Panel defaults

`z-index: 1100`, radius 12px, border `#E0E0E0`, background `#FDFDFD`, padding `10px 15px`, shadow `0 0 20px 0 rgba(0,0,0,0.06)`, Montserrat Regular 14px, black. Offset from the trigger is 8px and the panel is centre-aligned on its side.

It closes on mouse leave and on any scroll in the capture phase. Nothing renders when `content` is empty.

## Sides

`side` accepts a cardinal direction or a cardinal direction with an alignment: `top`, `top-left`, `top-right`, `right`, `right-top`, `right-bottom`, `bottom`, `bottom-left`, `bottom-right`, `left`, `left-top`, `left-bottom`. Values come from `FLOATING_SIDE` in `src/components/ui/overlay/use-floating-position.ts`.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `content` | `ReactNode` | required | Panel body; nothing renders when falsy |
| `children` | `ReactNode` | required | Trigger |
| `side` | `FloatingSide` | `"top"` | See above |
| `leaveDelay` | `number` | `0` | Milliseconds before hiding after mouse leave |
| `className` | `string` | — | Panel |
| `triggerClassName` | `string` | — | Trigger span |

Constant: `TOOLTIP_LEAVE_DELAY_MS` in `./config`.

## Example

```tsx
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { IconQuestion } from "@/components/icons/question";

<Tooltip content="The memo will be displayed in the history, visible only to you">
  <IconQuestion className="size-3.5 text-[#606060]" />
</Tooltip>
```

## Notes

- With the default `leaveDelay` of `0` the panel is `pointer-events: none`, so its content cannot be hovered or clicked. Pass a delay (for example `150`) when the tooltip contains a link.
- Hover only — there is no focus or touch trigger. Do not hide information that a keyboard or touch user needs behind a tooltip.
