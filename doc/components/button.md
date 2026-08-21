# Button

Path: `src/components/ui/button/Button.tsx`

Native `<button>` with `primary` / `normal` variants and size tokens. Disabled and loading states use `opacity: 0.3` and `cursor: not-allowed` (`pointer-events: none`).

## Variants

**primary** (default)

- Background `#000`, color `#FFF`, shadow `0 0 6px 0 rgba(0,0,0,0.06)`
- Hover: `opacity: 0.9`
- Font: Montserrat Medium

**normal**

- Background `#FFF`, color `#606060`, border `1px solid rgba(0,0,0,0.20)`, same shadow
- Hover: `background: rgba(0,0,0,0.05)`

## Sizes

| Size | Height | Font | Radius |
| --- | --- | --- | --- |
| `xl` | 56px | 16px | 12px |
| `lg` | 50px | 16px | 12px |
| `md` (default) | 40px | 16px | 10px |
| `sm` | 36px | 14px | 8px |

## Props

Extends `ButtonHTMLAttributes<HTMLButtonElement>`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `variant` | `"primary" \| "normal"` | `"primary"` | |
| `size` | `"xl" \| "lg" \| "md" \| "sm"` | `"md"` | |
| `loading` | `boolean` | `false` | Shows spinning `IconLoading` on the left and disables the button |
| `rounded` | `string` | — | Extra radius class, e.g. `rounded-full`; merged after size radius |
| `className` | `string` | — | Arbitrary overrides |
| `disabled` | `boolean` | — | Same visual treatment as loading |

Constants: `BUTTON_VARIANT` and `BUTTON_SIZE` in `./config`.

## Example

```tsx
import { Button } from "@/components/ui/button/Button";

<Button size="lg" loading={pending} onClick={onSubmit}>
  Create
</Button>

<Button variant="normal" rounded="rounded-[20px]">
  Cancel
</Button>
```
