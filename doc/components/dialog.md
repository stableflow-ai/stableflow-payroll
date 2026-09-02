# Dialog

Path: `src/components/ui/dialog/Dialog.tsx`

Centred modal from `768px` up (`DESKTOP_MEDIA_QUERY`). Below that it renders [Drawer](drawer.md) with `side="bottom"`, full width, and a square bottom edge, forwarding every prop it received.

The panel is a [Card](card.md) with `w-full md:w-[500px] max-h-[90vh]`. The header row is always rendered even when `title` is empty, so the layout does not jump. Body content is `children` and scrolls once it exceeds the panel height.

Nested dialogs stack: each open overlay takes the next z-index step above `1000`, Escape closes only the topmost one, and body scroll is locked while any overlay is open.

## Props

`DialogProps = OverlayChromeProps` (`src/components/ui/overlay/types.ts`), shared with Drawer.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `open` | `boolean` | required | Controlled visibility |
| `onClose` | `() => void` | — | Backdrop click, close button, Escape |
| `title` | `ReactNode` | — | Optional; the header row is kept either way |
| `children` | `ReactNode` | — | Scrollable body |
| `mask` | `boolean` | `true` | When `false` the backdrop is transparent |
| `maskClassName` | `string` | — | Backdrop classes. Default fill is `rgba(0,0,0,0.50)` |
| `closeOnMaskClick` | `boolean` | `true` | When `false` the backdrop also stops receiving pointer events |
| `cardClassName` | `string` | — | Panel / Card classes |
| `titleClassName` | `string` | — | Title `<h2>` |
| `headerAction` | `ReactNode` | — | Control between the title and the close button |
| `closeClassName` | `string` | — | Close button |
| `closeIcon` | `ReactNode` | `IconClose` | Replace the default close glyph |

## Example

```tsx
import { Dialog } from "@/components/ui/dialog/Dialog";
import { Button } from "@/components/ui/button/Button";

<Dialog open={open} onClose={() => setOpen(false)} title="Delete recipient">
  <p className="font-montserrat text-sm text-[#606060]">This cannot be undone.</p>
  <Button className="mt-6 w-full" onClick={confirm}>Delete</Button>
</Dialog>
```

## Notes

- The panel is rendered in a portal on `document.body`, so it is never clipped by an ancestor's `overflow`.
- Wallet SDK portals (RainbowKit, Near, Solana, Tron) sit at `WALLET_PORTAL_Z_INDEX` (`10000`), above every dialog layer. Do not raise a dialog past that.
- Focus is not trapped inside the panel. If a dialog needs keyboard containment, add it to `OverlayPanel` and note it here.
- Do not import `src/components/ui/overlay/` from feature code.
