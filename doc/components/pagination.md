# Pagination

Path: `src/components/ui/pagination/Pagination.tsx`

First / previous / page / next / last controls. Montserrat 12px, current-color strokes. Disabled controls use `opacity: 0.3` on the icon path.

`totalPage` is treated as at least `1` for display (`page/last`).

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `page` | `number` | required | Current page (1-based) |
| `totalPage` | `number` | required | Last page |
| `onPageChange` | `(page: number) => void` | required | Called with the next page |
| `className` | `string` | — | Root flex container |

## Example

```tsx
import { Pagination } from "@/components/ui/pagination/Pagination";

<Pagination page={page} totalPage={totalPage} onPageChange={setPage} />
```
