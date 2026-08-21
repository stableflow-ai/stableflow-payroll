# SearchInput

Path: `src/components/ui/search-input/SearchInput.tsx`

Figma: Decash `817:23120`.

Controlled text field. Left icon is `IconSearch`. When `value` is non-empty, a clear button (`IconClose`) appears on the right. Native browser search clear UI is removed (`type="text"` plus `::-webkit-search-cancel-button` hidden).

## Defaults

- Height 36px, `border-radius: 18px`
- Border `#EBEBEB`, background `#FFF`
- Placeholder color `#909090`, Montserrat 14px

## Props

Omits native `type` / `value` / `onChange`. Other input attributes are forwarded.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `string` | required | Controlled value |
| `onChange` | `(value: string) => void` | required | Called with the next string (clear sends `""`) |
| `placeholder` | `string` | `"Search"` | |
| `className` | `string` | — | Wrapper `<label>` |
| `inputClassName` | `string` | — | Native `<input>` |
| `disabled` | `boolean` | — | Dims field and blocks clear |

## Example

```tsx
import { SearchInput } from "@/components/ui/search-input/SearchInput";

<SearchInput
  value={query}
  onChange={setQuery}
  placeholder="Search by address"
  className="w-[230px]"
/>
```
