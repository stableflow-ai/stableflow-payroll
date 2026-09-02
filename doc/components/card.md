# Card

Path: `src/components/ui/card/Card.tsx`

The surface primitive. A plain `<div>` with the product's panel styling, used directly for page panels and internally by [Dialog](dialog.md), [Drawer](drawer.md), and [Table](table.md).

## Defaults

- `border-radius: 20px`
- `border: 1px solid #FFF`
- `background: #FDFDFD`
- `padding: 20px`
- `box-shadow: 0 0 20px 0 rgba(0,0,0,0.06)`

## Props

`CardProps = HTMLAttributes<HTMLDivElement>`. Every div attribute is forwarded; `className` is merged with `cn()` so any default can be overridden.

## Example

```tsx
import { Card } from "@/components/ui/card/Card";

<Card className="mx-auto w-full max-w-[776px] px-6 py-7 sm:px-8">
  {children}
</Card>
```

## Notes

- Reach for Card before hand-rolling a panel; the radius, border, and shadow are not repeated anywhere else.
- Padding is part of the default. Override it on the caller (`p-0`, `px-6 py-7`) rather than wrapping the Card in another box.
