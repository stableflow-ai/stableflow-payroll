# Tooltip

Path: `src/components/ui/tooltip/Tooltip.tsx`

Figma: Decash `816:23106`.

Renders the panel with `createPortal` into `document.body` so overflow/stacking contexts cannot clip it. Closes immediately on any scroll (capture listener). `leaveDelay` defaults to `0` (close as soon as the pointer leaves the trigger). When `leaveDelay` is `0`, the panel uses `pointer-events: none` so a width-constrained panel cannot cover the trigger and flicker.

## Panel defaults

- `border-radius: 12px`
- `border: 1px solid #E0E0E0`
- `background: #FDFDFD`
- `box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.06)`
- Montserrat 14px / `#000`

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `content` | `ReactNode` | required | Panel body |
| `children` | `ReactNode` | required | Trigger |
| `leaveDelay` | `number` | `0` | Milliseconds before close after mouse leave. When `> 0`, hovering the panel keeps it open |
| `side` | `"top" \| "top-left" \| "top-right" \| "right" \| "right-top" \| "right-bottom" \| "bottom" \| "bottom-left" \| "bottom-right" \| "left" \| "left-top" \| "left-bottom"` | `"top"` | Cardinal values (`top` / `right` / `bottom` / `left`) center on that edge. Composite values edge-align (`top-left` shares the trigger’s left edge above it; `left-bottom` shares the bottom edge to the left). Viewport-clamped |
| `className` | `string` | — | Panel classes |
| `triggerClassName` | `string` | — | Extra classes on the trigger wrapper (`span.inline-flex.max-w-full`) |

## Example

```tsx
import { Tooltip } from "@/components/ui/tooltip/Tooltip";

<Tooltip content={<><p>Memo:</p><p>Chat GPT 5-6 vip package</p></>}>
  <span>include expense</span>
</Tooltip>
```

## Notes

- The trigger is wrapped in `span.inline-flex.max-w-full`. Pass `triggerClassName` to fix layout (for example `block w-full`) instead of wrapping another element.
- Page scroll (including nested scroll containers) dismisses the tooltip.
- Panel `className` width (`w-[285px]`, `max-w-*`) is used when measuring placement. Do not expect `max-content` to override it.
