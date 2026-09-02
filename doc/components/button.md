# Button

Path: `src/components/ui/button/Button.tsx`

Native `<button>` built with `cva`. Two variants and four size tokens. `type` defaults to `"button"`, so a button inside a form does not submit unless you pass `type="submit"`.

Disabled and loading share one visual treatment: `opacity: 0.3`, `cursor: not-allowed`, `pointer-events: none`.

## Variants

**primary** (default)
- Background `#000`, colour `#FFF`, transparent border, shadow `0 0 6px 0 rgba(0,0,0,0.06)`
- Hover: `opacity: 0.9`

**normal**
- Background `#FFF`, colour `#606060`, border `1px solid rgba(0,0,0,0.20)`, same shadow
- Hover: `background: rgba(0,0,0,0.05)`

Both are Montserrat Medium with `gap-2` and horizontal padding `12px` (`20px` from `md` up).

## Sizes

Heights and font sizes change at the `md` breakpoint.

| Size | Height (mobile / `md`) | Font (mobile / `md`) | Radius |
| --- | --- | --- | --- |
| `xl` | 48px / 56px | 15px / 16px | 12px |
| `lg` | 40px / 50px | 14px / 16px | 12px |
| `md` (default) | 32px / 40px | 13px / 16px | 10px |
| `sm` | 24px / 36px | 20px / 14px | 8px |

## Props

Extends `ButtonHTMLAttributes<HTMLButtonElement>`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `variant` | `"primary" \| "normal"` | `"primary"` | |
| `size` | `"xl" \| "lg" \| "md" \| "sm"` | `"md"` | |
| `loading` | `boolean` | `false` | Shows a spinning `IconLoading` on the left and disables the button |
| `rounded` | `string` | — | Extra radius class such as `rounded-full`; merged after the size radius |
| `className` | `string` | — | Arbitrary overrides, merged last |
| `disabled` | `boolean` | — | Same visual treatment as `loading` |
| `type` | `string` | `"button"` | |

Constants: `BUTTON_VARIANT` and `BUTTON_SIZE` in `./config`. `buttonVariants` is exported for callers that need the class string without the element.

## Example

```tsx
import { Button } from "@/components/ui/button/Button";
import { BUTTON_SIZE, BUTTON_VARIANT } from "@/components/ui/button/config";

<Button type="submit" size={BUTTON_SIZE.Lg} loading={loginMutation.isPending} className="mt-6 w-full">
  Sign in
</Button>

<Button variant={BUTTON_VARIANT.Normal} size={BUTTON_SIZE.Sm} rounded="rounded-[6px]">
  Export CSV
</Button>
```

## Notes

- There is no `danger` variant. Destructive confirmations use `primary` with an overriding `className`.
- The spinner replaces nothing: children stay in place and the icon is prepended, so a label does not need to change while loading.
