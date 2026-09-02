# Pagination

Path: `src/components/ui/pagination/Pagination.tsx`

Compact pager: first, previous, `page/total`, next, last. Controlled — it renders what you pass and reports the requested page; it does not hold state or clamp `page` for you.

Montserrat Medium 12px with `gap: 15px`. Arrow buttons are 16px squares and drop to `opacity: 0.3` when the move is unavailable. `totalPage` is floored at `1`, so an empty result still renders `1/1`.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `page` | `number` | required | Current page, 1-based |
| `totalPage` | `number` | required | Values below `1` are treated as `1` |
| `onPageChange` | `(page: number) => void` | required | Receives `1`, `page - 1`, `page + 1`, or `totalPage` |
| `className` | `string` | — | Wrapper |

## Example

```tsx
import { Pagination } from "@/components/ui/pagination/Pagination";

const totalPage = Math.max(1, query.data?.totalPage ?? 1);

<Pagination page={Math.min(page, totalPage)} totalPage={totalPage} onPageChange={setPage} />
```

## Notes

- Clamp `page` yourself when filters shrink the result set, as the example does; the component will happily render `7/3`.
- There are no numbered page links. Do not add them here without a design.
