# Dialog

Path: `src/components/ui/dialog/Dialog.tsx`

Figma: DapDap V2 `41559:93`.

Centered modal on desktop (`min-width: 768px`). Below that breakpoint it renders [Drawer](drawer.md) with `side="bottom"` and `width: 100%`. Nested dialogs stack (each open instance gets a higher z-index). Escape closes the topmost overlay.

The panel uses [Card](card.md) defaults. The title row is always rendered (styles reserved) even when `title` is empty. Body content is passed as `children` and scrolls when it exceeds `max-h-[90vh]`.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `open` | `boolean` | required | Controlled visibility |
| `onClose` | `() => void` | — | Mask click, close button, Escape |
| `title` | `ReactNode` | — | Optional; header layout is kept |
| `children` | `ReactNode` | — | Scrollable body |
| `mask` | `boolean` | `true` | When `false`, backdrop is transparent |
| `maskClassName` | `string` | — | Backdrop classes. Default fill is `rgba(0,0,0,0.50)` |
| `closeOnMaskClick` | `boolean` | `true` | Click backdrop to close |
| `cardClassName` | `string` | — | Panel / Card classes |
| `titleClassName` | `string` | — | Title `<h2>` |
| `closeClassName` | `string` | — | Close button |
| `closeIcon` | `ReactNode` | `IconClose` | Replace the default close icon |

## Example

```tsx
import { Dialog } from "@/components/ui/dialog/Dialog";
import { Button } from "@/components/ui/button/Button";

<Dialog
  open={open}
  onClose={() => setOpen(false)}
  title="Create New API Key"
  closeOnMaskClick
>
  <Button className="w-full" size="lg">Create</Button>
</Dialog>
```

## Notes

- Multiple dialogs can be open at once; only the top overlay handles Escape and receives the topmost mask.
- Do not import `src/components/ui/overlay/` from feature code.
- Mobile stacking uses bottom drawers, also layered by z-index.
