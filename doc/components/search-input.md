# SearchInput

Path: `src/components/ui/search-input/SearchInput.tsx`

Pill-shaped text input with a leading search glyph and a clear button that appears once there is a value. Always controlled: `onChange` receives the string, not the event.

## Defaults

- Height 36px, `border-radius: 18px`, border `#ebebeb`, white background
- Montserrat Regular 14px, placeholder `#909090`
- `IconSearch` pinned left; padding shifts from `pr-3` to `pr-8` when the clear button shows
- Clear button is a 20px hit area on the right, `#909090` turning black on hover
- Disabled: `opacity: 0.3`, `cursor: not-allowed`
- The root is a `<label>`, so clicking anywhere in the pill focuses the input

## Props

Extends `InputHTMLAttributes<HTMLInputElement>` minus `type`, `value`, and `onChange`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `string` | required | Controlled value |
| `onChange` | `(value: string) => void` | required | Called with the new string; the clear button calls it with `""` |
| `placeholder` | `string` | `"Search"` | |
| `className` | `string` | — | The `<label>` wrapper — set the width here |
| `inputClassName` | `string` | — | The `<input>` itself |
| `disabled` | `boolean` | — | Also disables the clear button |

Constant: `SEARCH_INPUT_PLACEHOLDER` in `./config`.

## Example

```tsx
import { SearchInput } from "@/components/ui/search-input/SearchInput";

<SearchInput
  value={search}
  onChange={(value) => { setSearch(value); setPage(1); }}
  placeholder="Search by address"
  className="w-full sm:max-w-[230px]"
/>
```

## Notes

- The wrapper is `block w-full`; constrain it with `className` rather than wrapping it in another sized div.
- There is no debounce. Debounce in the caller when the value feeds a request.
